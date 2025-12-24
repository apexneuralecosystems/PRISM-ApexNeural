import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export function ScheduleInterview() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const webhookId = searchParams.get('webhook_id');
    const orgEmail = searchParams.get('orgEmail');
    const orgName = searchParams.get('orgName');
    const round = searchParams.get('round');
    const team = searchParams.get('team');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [freeSlots, setFreeSlots] = useState<Record<string, any[]>>({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyScheduled, setAlreadyScheduled] = useState(false);
    const [scheduledData, setScheduledData] = useState<any>(null);
    
    useEffect(() => {
        if (!webhookId || !orgEmail || !orgName || !team) {
            setError('Invalid form link. Missing required parameters.');
            return;
        }
        
        // Check if already scheduled first
        checkWebhookStatus();
    }, [webhookId, orgEmail, orgName, team]);
    
    const checkWebhookStatus = async () => {
        if (!webhookId) {
            // If no webhook_id, just fetch slots
            fetchFreeSlots();
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/check-webhook-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhook_id: webhookId })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.submitted) {
                    // Already scheduled - show message
                    setAlreadyScheduled(true);
                    setScheduledData(data.data);
                    setLoading(false);
                } else {
                    // Not scheduled yet, fetch free slots (which will exclude already booked slots)
                    fetchFreeSlots();
                }
            } else {
                // If check fails, still try to fetch slots
                fetchFreeSlots();
            }
        } catch (err) {
            // If check fails, still try to fetch slots
            fetchFreeSlots();
        }
    };
    
    const fetchFreeSlots = async () => {
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/get-free-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgEmail,
                    orgName,
                    teamName: team,
                    webhook_id: webhookId || undefined
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to fetch available slots');
            }
            
            const data = await res.json();
            if (data.success) {
                if (data.no_slots_available || Object.keys(data.free_slots || {}).length === 0) {
                    setError('No interview slots are available for the next 5 working days. All team members are busy. Please try again later or contact the organization for alternative arrangements.');
                } else if (data.free_slots) {
                    setFreeSlots(data.free_slots);
                } else {
                    setError('No available slots found. Please contact the organization.');
                }
            } else {
                setError('No available slots found. Please contact the organization.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load available time slots');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedDate || !selectedSlot) {
            setError('Please select a date and time slot');
            return;
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            // Find the selected slot details
            const slotsForDate = freeSlots[selectedDate] || [];
            const slotDetails = slotsForDate.find(s => s.slot_id === selectedSlot);
            
            if (!slotDetails) {
                throw new Error('Invalid slot selected');
            }
            
            const res = await fetch(`${API_BASE_URL}/api/submit-interview-form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhook_id: webhookId,
                    selected_date: selectedDate,
                    selected_slot_id: selectedSlot,
                    selected_time: `${slotDetails.start} - ${slotDetails.end}`
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = errorData.detail || 'Failed to submit form';
                
                // Check if it's a conflict (slot already booked)
                if (res.status === 409) {
                    setError(`${errorMessage} Please refresh the page and select a different time slot.`);
                } else {
                    throw new Error(errorMessage);
                }
                return;
            }
            
            const data = await res.json();
            
            if (data.success) {
                // Show success message
                setError(''); // Clear any errors
                alert('✅ Interview scheduled successfully! You will receive a confirmation email shortly.');
                // Redirect to home page
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to schedule interview');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const availableDates = Object.keys(freeSlots);
    const slotsForSelectedDate = selectedDate ? freeSlots[selectedDate] || [] : [];
    
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Schedule Your Interview</h1>
                <p className="text-slate-600 mb-6">
                    {round} at {orgName}
                </p>
                
                {alreadyScheduled && scheduledData && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">✅ Interview Already Scheduled</h3>
                        <p className="mb-2">Your interview has already been scheduled for:</p>
                        <div className="bg-white rounded p-3 mt-2">
                            <p className="font-medium">Date: {scheduledData.selected_date}</p>
                            <p className="font-medium">Time: {scheduledData.selected_time}</p>
                            {scheduledData.location_type && (
                                <p className="font-medium">Location: {scheduledData.location_type === 'online' ? 'Online' : 'Offline'}</p>
                            )}
                            {scheduledData.location && (
                                <p className="font-medium">Address: {scheduledData.location}</p>
                            )}
                        </div>
                        <p className="text-sm mt-3 text-green-700">
                            You will receive a confirmation email with the interview details. If you need to reschedule, please contact {orgName}.
                        </p>
                    </div>
                )}
                
                {loading && !alreadyScheduled && (
                    <div className="text-center py-8">
                        <p className="text-slate-600">Loading available time slots...</p>
                    </div>
                )}
                
                {error && !alreadyScheduled && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                {!loading && !error && !alreadyScheduled && availableDates.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                        No available time slots found. Please contact {orgName} for alternative arrangements.
                    </div>
                )}
                
                {!loading && !error && !alreadyScheduled && availableDates.length > 0 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Select Date
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedSlot(''); // Reset slot when date changes
                                }}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Choose a date...</option>
                                {availableDates.map(date => (
                                    <option key={date} value={date}>
                                        {date}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {selectedDate && slotsForSelectedDate.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Time Slot
                                </label>
                                <select
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Choose a time slot...</option>
                                    {slotsForSelectedDate.map(slot => (
                                        <option key={slot.slot_id} value={slot.slot_id}>
                                            {slot.start} - {slot.end}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {selectedDate && slotsForSelectedDate.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                                No available slots for this date. Please select another date.
                            </div>
                        )}
                        
                        
                        {submitting && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                                    <span>Checking slot availability and scheduling interview...</span>
                                </div>
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={!selectedDate || !selectedSlot || submitting}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Scheduling...' : 'Confirm Interview Time'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

