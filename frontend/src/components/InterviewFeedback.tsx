import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export function InterviewFeedback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const feedbackId = searchParams.get('feedback_id');
    const webhookId = searchParams.get('webhook_id');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [formData, setFormData] = useState({
        candidate_attended: '',
        technical_configuration: '',
        technical_customization: '',
        communication_skills: '',
        leadership_abilities: '',
        enthusiasm: '',
        teamwork: '',
        attitude: '',
        interview_outcome: ''
    });
    
    useEffect(() => {
        if (!feedbackId) {
            setError('Invalid feedback form link. Missing feedback ID.');
            return;
        }
        
        checkFeedbackStatus();
    }, [feedbackId]);
    
    const checkFeedbackStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/check-feedback-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback_id: feedbackId })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.submitted) {
                    setAlreadySubmitted(true);
                }
            }
        } catch (err) {
            console.error('Error checking feedback status:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.candidate_attended) {
            setError('Please select whether the candidate attended the interview');
            return;
        }
        
        if (formData.candidate_attended === 'yes') {
            const requiredFields = [
                'technical_configuration', 'technical_customization',
                'communication_skills', 'leadership_abilities',
                'enthusiasm', 'teamwork', 'attitude', 'interview_outcome'
            ];
            
            for (const field of requiredFields) {
                if (!formData[field as keyof typeof formData]) {
                    setError(`Please fill all required fields`);
                    return;
                }
            }
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/submit-interview-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback_id: feedbackId,
                    candidate_attended: formData.candidate_attended,
                    technical_configuration: parseInt(formData.technical_configuration) || 0,
                    technical_customization: parseInt(formData.technical_customization) || 0,
                    communication_skills: parseInt(formData.communication_skills) || 0,
                    leadership_abilities: parseInt(formData.leadership_abilities) || 0,
                    enthusiasm: parseInt(formData.enthusiasm) || 0,
                    teamwork: parseInt(formData.teamwork) || 0,
                    attitude: parseInt(formData.attitude) || 0,
                    interview_outcome: formData.interview_outcome
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to submit feedback');
            }
            
            const data = await res.json();
            if (data.success) {
                alert('✅ Feedback submitted successfully!');
                navigate('/');
            } else {
                throw new Error(data.message || 'Failed to submit feedback');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center py-8">
                        <p className="text-slate-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (alreadySubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">✅ Feedback Already Submitted</h3>
                        <p>You have already submitted feedback for this interview. Thank you!</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Feedback Form</h1>
                <p className="text-slate-600 mb-6">
                    Please provide your feedback for the interview conducted.
                </p>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Did the candidate attend the Interview? <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="candidate_attended"
                            value={formData.candidate_attended}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="reschedule">Reschedule</option>
                        </select>
                    </div>
                    
                    {formData.candidate_attended === 'yes' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Technical Skills: Configuration <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="technical_configuration"
                                        value={formData.technical_configuration}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Technical Skills: Customization <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="technical_customization"
                                        value={formData.technical_customization}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Communication Skills <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="communication_skills"
                                        value={formData.communication_skills}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Leadership Abilities <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="leadership_abilities"
                                        value={formData.leadership_abilities}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Enthusiasm <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="enthusiasm"
                                        value={formData.enthusiasm}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Team Work <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="teamwork"
                                        value={formData.teamwork}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Attitude <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="attitude"
                                        value={formData.attitude}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select (1-5)</option>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Interview Outcome <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="interview_outcome"
                                        value={formData.interview_outcome}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="selected">Selected</option>
                                        <option value="proceed">Proceed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>
        </div>
    );
}

