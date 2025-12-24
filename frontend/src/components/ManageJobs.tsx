import React, { useState, useEffect } from 'react';
import {
    Briefcase, Users, CheckCircle, X, Clock, UserCheck, LogOut,
    ChevronDown, Mail, FileText, Download, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

interface Job {
    job_id: string;
    role: string;
    location: string;
    company: {
        name: string;
        email: string;
    };
}

interface Applicant {
    _id: string;
    job_id: string;
    name: string;
    email: string;
    status: string;
    applied_at: string;
    resume_url?: string;
    additional_details?: string;
    ongoing_rounds?: any[];
    previous_rounds?: any[];
    profile?: {
        name: string;
        resume_url: string;
        parsed_resume_data?: any;
        additional_details?: string;
    };
}

export function ManageJobs() {
    const navigate = useNavigate();
    const [ongoingJobs, setOngoingJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'ongoing' | 'conduct_rounds' | 'selected' | 'invitation_sent'>('pending');
    
    // Schedule Interview form state
    const [teams, setTeams] = useState<any[]>([]);
    const [showScheduleForm, setShowScheduleForm] = useState<string | null>(null);
    const [selectedRound, setSelectedRound] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedLocationType, setSelectedLocationType] = useState<string>('');

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/organization-profile');
                return;
            }
            setUserData(parsedUser);
        }

        fetchOngoingJobs();
    }, [navigate]);

    const fetchOngoingJobs = async () => {
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_JOBPOST_ONGOING,
                { method: 'GET' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setOngoingJobs(result.jobs || []);
            }
        } catch (err) {
            console.error('Failed to fetch ongoing jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicants = async (jobId: string) => {
        if (!jobId) {
            setApplicants([]);
            return;
        }

        setLoading(true);
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.GET_JOB_APPLICANTS(jobId),
                { method: 'GET' },
                navigate
            );

            if (!res) {
                setLoading(false);
                return;
            }

            if (res.ok) {
                const result = await res.json();
                setApplicants(result.applicants || []);
            }
        } catch (err) {
            console.error('Failed to fetch applicants:', err);
            setMessage({ type: 'error', text: 'Error loading applicants' });
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelect = (jobId: string) => {
        setSelectedJobId(jobId);
        if (jobId) {
            fetchApplicants(jobId);
        }
    };

    const handleStatusChange = async (applicantEmail: string, newStatus: string) => {
        if (!selectedJobId) return;

        setUpdatingStatus(applicantEmail);
        setMessage(null);

        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.UPDATE_APPLICANT_STATUS(selectedJobId, applicantEmail),
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                },
                navigate
            );

            if (!res) {
                setUpdatingStatus(null);
                return;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Status updated successfully!' });
                // Refresh applicants
                fetchApplicants(selectedJobId);
                
                // Navigate to appropriate tab based on status
                if (newStatus === 'selected_for_interview') {
                    setActiveTab('conduct_rounds');
                } else if (newStatus === 'selected') {
                    setActiveTab('selected');
                } else if (newStatus === 'processing') {
                    setActiveTab('ongoing');
                } else if (newStatus === 'decision_pending' || newStatus === 'applied') {
                    setActiveTab('pending');
                }
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to update status' });
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            setMessage({ type: 'error', text: 'Error updating status' });
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
            try {
                await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    // Fetch teams for schedule interview
    const fetchTeams = async () => {
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_TEAMS,
                { method: 'GET' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setTeams(result.teams || []);
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    // Handle schedule interview submit
    const handleScheduleSubmit = async (email: string) => {
        const applicant = conductRounds.find(a => a.email === email);
        
        if (!applicant) {
            console.error('Applicant not found');
            return;
        }
        
        if (!selectedLocationType) {
            setMessage({ type: 'error', text: 'Please select interview location type (Online or Offline)' });
            return;
        }
        
        const scheduleData = {
            applicantName: applicant.name,
            applicantEmail: email,
            round: selectedRound,
            team: selectedTeam,
            orgName: userData?.name,
            orgEmail: userData?.email,
            job_id: selectedJobId,
            location_type: selectedLocationType
        };
        
        console.log('Schedule Interview Details:', scheduleData);
        
        try {
            // Call backend to send interview form email
            const res = await authenticatedFetch(
                `${API_BASE_URL}/api/send-interview-form`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduleData)
                },
                navigate
            );
            
            if (res && res.ok) {
                const result = await res.json();
                console.log('✅ Interview form email sent:', result);
                setMessage({ type: 'success', text: 'Interview scheduling form has been sent to the applicant!' });
                
                // Close form and reset
                setShowScheduleForm(null);
                setSelectedRound('');
                setSelectedTeam('');
                setSelectedLocationType('');
                
                // Refresh applicants to update status and move to invitation_sent tab
                if (selectedJobId) {
                    await fetchApplicants(selectedJobId);
                    // Switch to invitation_sent tab after refresh
                    setTimeout(() => {
                        setActiveTab('invitation_sent');
                    }, 100);
                }
            } else {
                const errorData = await res?.json();
                console.error('Failed to send interview form:', errorData);
                setMessage({ type: 'error', text: errorData?.detail || 'Failed to send interview form. Please try again.' });
            }
        } catch (error: any) {
            console.error('Error sending interview form:', error);
            setMessage({ type: 'error', text: 'Error sending interview form. Please try again.' });
        }
    };

    // Categorize applicants into panels
    const decisionPending = applicants.filter(app => 
        app.status === 'applied' || app.status === 'decision_pending' || !app.status
    );
    const invitationSent = applicants.filter(app => 
        app.status === 'invitation_sent'
    );
    const ongoingRounds = applicants.filter(app => 
        app.status === 'processing'
    );
    const conductRounds = applicants.filter(app => 
        app.status === 'selected_for_interview'
    );
    const selected = applicants.filter(app => app.status === 'selected');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'selected': return 'bg-green-100 text-green-700';
            case 'selected_for_interview': return 'bg-blue-100 text-blue-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'decision_pending': return 'bg-yellow-100 text-yellow-700';
            case 'invitation_sent': return 'bg-orange-100 text-orange-700';
            case 'processing': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading && ongoingJobs.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-900">Manage Jobs</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`max-w-7xl mx-auto mt-4 px-6 py-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Job Selection Dropdown */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Ongoing Job
                    </label>
                    <div className="relative">
                        <select
                            value={selectedJobId}
                            onChange={(e) => handleJobSelect(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="">-- Select a job --</option>
                            {ongoingJobs.map((job) => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.role} - {job.location}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {selectedJobId ? (
                    <>
                        {/* Four Tabs */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="flex border-b border-slate-200">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                        activeTab === 'pending'
                                            ? 'text-yellow-700 border-b-2 border-yellow-600 bg-yellow-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    Decision Pending ({decisionPending.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('invitation_sent')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                        activeTab === 'invitation_sent'
                                            ? 'text-orange-700 border-b-2 border-orange-600 bg-orange-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Invitation Sent ({invitationSent.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('conduct_rounds')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                        activeTab === 'conduct_rounds'
                                            ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Conduct Rounds ({conductRounds.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('ongoing')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                        activeTab === 'ongoing'
                                            ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Ongoing Rounds ({ongoingRounds.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('selected')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                        activeTab === 'selected'
                                            ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Selected ({selected.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'pending' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {decisionPending.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No applicants pending decision</p>
                                        ) : (
                                            decisionPending.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={handleStatusChange}
                                                    updatingStatus={updatingStatus === applicant.email}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'invitation_sent' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {invitationSent.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No invitations sent</p>
                                        ) : (
                                            invitationSent.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={() => {}} // Disabled - no status change allowed
                                                    updatingStatus={false}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                    viewMode="view_only"
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'conduct_rounds' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {conductRounds.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No applicants selected for interview</p>
                                        ) : (
                                            conductRounds.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={handleStatusChange}
                                                    updatingStatus={updatingStatus === applicant.email}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                    viewMode="conduct"
                                                    teams={teams}
                                                    showScheduleForm={showScheduleForm === applicant.email}
                                                    onOpenScheduleForm={(email) => {
                                                        setShowScheduleForm(email);
                                                        setSelectedRound('');
                                                        setSelectedTeam('');
                                                        fetchTeams();
                                                    }}
                                                    onCloseScheduleForm={() => {
                                                        setShowScheduleForm(null);
                                                        setSelectedRound('');
                                                        setSelectedTeam('');
                                                    }}
                                                    selectedRound={selectedRound}
                                                    selectedTeam={selectedTeam}
                                                    selectedLocationType={selectedLocationType}
                                                    onRoundChange={setSelectedRound}
                                                    onTeamChange={setSelectedTeam}
                                                    onLocationTypeChange={setSelectedLocationType}
                                                    onSubmitSchedule={handleScheduleSubmit}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'ongoing' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {ongoingRounds.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No applicants in ongoing rounds</p>
                                        ) : (
                                            ongoingRounds.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={() => {}} // Disabled - no status change allowed
                                                    updatingStatus={false}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                    viewMode="view_only"
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'selected' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {selected.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No selected applicants yet</p>
                                        ) : (
                                            selected.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={() => {}} // Disabled - no status change allowed
                                                    updatingStatus={false}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                    viewMode="view_only"
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-200">
                        <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            {ongoingJobs.length === 0 ? 'No ongoing jobs' : 'Select a job to manage applicants'}
                        </h3>
                        <p className="text-slate-500">
                            {ongoingJobs.length === 0 
                                ? 'You don\'t have any ongoing jobs to manage.' 
                                : 'Please select a job from the dropdown above.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Applicant Card Component
const ApplicantCard = ({
    applicant,
    onStatusChange,
    updatingStatus,
    formatDate,
    getStatusColor,
    viewMode = 'default',
    teams = [],
    showScheduleForm = false,
    onOpenScheduleForm,
    onCloseScheduleForm,
    selectedRound = '',
    selectedTeam = '',
    selectedLocationType = '',
    onRoundChange,
    onTeamChange,
    onLocationTypeChange,
    onSubmitSchedule
}: {
    applicant: Applicant;
    onStatusChange: (email: string, status: string) => void;
    updatingStatus: boolean;
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
    viewMode?: 'default' | 'conduct' | 'view_only';
    teams?: any[];
    showScheduleForm?: boolean;
    onOpenScheduleForm?: (email: string) => void;
    onCloseScheduleForm?: () => void;
    selectedRound?: string;
    selectedTeam?: string;
    selectedLocationType?: string;
    onRoundChange?: (round: string) => void;
    onTeamChange?: (team: string) => void;
    onLocationTypeChange?: (locationType: string) => void;
    onSubmitSchedule?: (email: string) => void;
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showPreviousRounds, setShowPreviousRounds] = useState(false);
    const isConductMode = viewMode === 'conduct';
    const isViewOnly = viewMode === 'view_only';

    const statusOptions = [
        { value: 'decision_pending', label: 'Decision Pending' },
        { value: 'selected_for_interview', label: 'Selected for Interview' },
        { value: 'selected', label: 'Selected' },
        { value: 'rejected', label: 'Rejected' }
    ];

    const roundOptions = [
        'Initial Screening Round',
        'Technical Round 1',
        'Technical Round 2',
        'Managerial Round',
        'Final Technical Round',
        'Discussion Round',
        'Negotiation / Offer Round'
    ];

    if (isConductMode) {
        return (
            <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{applicant.name || 'N/A'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <p className="text-sm text-slate-600">{applicant.email}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    {(applicant.resume_url || applicant.profile?.resume_url || applicant.additional_details || applicant.profile?.additional_details) && (
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                        >
                            <FileText className="w-4 h-4" />
                            {showDetails ? 'Hide' : 'View'} Details
                        </button>
                    )}
                    {/* Hide previous rounds button for decision pending */}
                    {(applicant.status !== 'decision_pending' && applicant.status !== 'applied') && (
                        <button
                            onClick={() => setShowPreviousRounds(!showPreviousRounds)}
                            className="w-full text-sm text-slate-700 hover:text-slate-900 font-medium flex items-center justify-center gap-1 border border-slate-200 rounded-lg py-2"
                            disabled={!applicant.previous_rounds || applicant.previous_rounds.length === 0}
                        >
                            <UserCheck className="w-4 h-4" />
                            View Previous Rounds {applicant.previous_rounds && applicant.previous_rounds.length > 0 && `(${applicant.previous_rounds.length})`}
                        </button>
                    )}
                </div>

                {/* Show ongoing rounds */}
                {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-slate-700">Ongoing Rounds:</p>
                        {applicant.ongoing_rounds.map((round: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                                <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                                <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                                <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                                <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                                {round.location_type && (
                                    <p className="text-slate-700"><strong>Location Type:</strong> {round.location_type === 'online' ? 'Online' : 'Offline'}</p>
                                )}
                                {round.location_type === 'online' && round.meeting_link && (
                                    <p className="text-slate-700"><strong>Meeting:</strong> <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{round.meeting_link}</a></p>
                                )}
                                {round.location_type === 'offline' && round.location && (
                                    <p className="text-slate-700"><strong>Location:</strong> {round.location}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Show previous rounds - Hide for decision pending status */}
                {showPreviousRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && 
                 applicant.status !== 'decision_pending' && applicant.status !== 'applied' && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-slate-700">Previous Rounds:</p>
                        {applicant.previous_rounds.map((round: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                                <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                                <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                                <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                                <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                                <p className="text-slate-700"><strong>Attended:</strong> {round.candidate_attended}</p>
                                <p className="text-slate-700"><strong>Outcome:</strong> {round.interview_outcome}</p>
                                {round.scores && (
                                    <div className="mt-2 pt-2 border-t border-slate-300">
                                        <p className="font-medium text-slate-900 mb-1">Scores:</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                <p key={key} className="text-slate-700"><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}/5</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {round.reason && (
                                    <p className="text-slate-700 mt-1"><strong>Reason:</strong> {round.reason}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {(!applicant.previous_rounds || applicant.previous_rounds.length === 0) && 
                 applicant.status !== 'decision_pending' && applicant.status !== 'applied' && (
                    <p className="text-xs text-slate-500 mt-2 mb-2">No previous rounds yet.</p>
                )}

                {/* Schedule Interview Button or Invitation Sent Status */}
                {applicant.status === 'invitation_sent' ? (
                    <div className="w-full text-sm text-slate-600 bg-slate-100 font-medium flex items-center justify-center gap-1 rounded-lg py-2">
                        <Calendar className="w-4 h-4" />
                        Invitation Sent - Awaiting Response
                    </div>
                ) : (
                    <button
                        onClick={() => onOpenScheduleForm?.(applicant.email)}
                        className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium flex items-center justify-center gap-1 rounded-lg py-2 transition-colors"
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule Interview
                    </button>
                )}

                {/* Schedule Interview Form Modal */}
                {showScheduleForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-900">Schedule Interview</h3>
                                <button
                                    onClick={onCloseScheduleForm}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select Round
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedRound}
                                            onChange={(e) => onRoundChange?.(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                        >
                                            <option value="">-- Select Round --</option>
                                            {roundOptions.map((round) => (
                                                <option key={round} value={round}>
                                                    {round}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select Team
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedTeam}
                                            onChange={(e) => onTeamChange?.(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                        >
                                            <option value="">-- Select Team --</option>
                                            {teams.map((team) => (
                                                <option key={team.team_id} value={team.team_name}>
                                                    {team.team_name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Interview Location <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedLocationType}
                                            onChange={(e) => onLocationTypeChange?.(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                        >
                                            <option value="">-- Select Location Type --</option>
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                    {selectedLocationType === 'offline' && (
                                        <p className="text-xs text-slate-600 mt-1">
                                            The interview location will be fetched from your organization profile.
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={onCloseScheduleForm}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSubmitSchedule?.(applicant.email)}
                                        disabled={!selectedRound || !selectedTeam || !selectedLocationType}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDetails && (applicant.additional_details || applicant.profile?.additional_details) && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">AI Comparison Details</h4>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                            {applicant.additional_details || applicant.profile?.additional_details}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{applicant.name || 'N/A'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <p className="text-sm text-slate-600">{applicant.email}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Applied: {formatDate(applicant.applied_at)}
                    </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(applicant.status || 'applied')}`}>
                    {(applicant.status || 'applied').replace('_', ' ').toUpperCase()}
                </span>
            </div>

            {/* Show ongoing rounds */}
            {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 && (
                <div className="mb-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">Ongoing Rounds:</p>
                    {applicant.ongoing_rounds.map((round: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                            <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                            <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                            <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                            <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                            {round.location_type && (
                                <p className="text-slate-700"><strong>Location Type:</strong> {round.location_type === 'online' ? 'Online' : 'Offline'}</p>
                            )}
                            {round.location_type === 'online' && round.meeting_link && (
                                <p className="text-slate-700"><strong>Meeting:</strong> <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{round.meeting_link}</a></p>
                            )}
                            {round.location_type === 'offline' && round.location && (
                                <p className="text-slate-700"><strong>Location:</strong> {round.location}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Previous Rounds Toggle - Hide for decision pending status */}
            {applicant.previous_rounds && applicant.previous_rounds.length > 0 && 
             applicant.status !== 'decision_pending' && applicant.status !== 'applied' && (
                <div className="mb-3">
                    <button
                        onClick={() => setShowPreviousRounds(!showPreviousRounds)}
                        className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 border border-blue-200 rounded-lg py-2 bg-blue-50"
                    >
                        <UserCheck className="w-3 h-3" />
                        {showPreviousRounds ? 'Hide' : 'View'} Previous Rounds ({applicant.previous_rounds.length})
                    </button>
                </div>
            )}

            {/* Show previous rounds */}
            {showPreviousRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                <div className="mb-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">Previous Rounds:</p>
                    {applicant.previous_rounds.map((round: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                            <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                            <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                            <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                            <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                            {round.location_type && (
                                <p className="text-slate-700"><strong>Location Type:</strong> {round.location_type === 'online' ? 'Online' : 'Offline'}</p>
                            )}
                            {round.location_type === 'online' && round.meeting_link && (
                                <p className="text-slate-700"><strong>Meeting:</strong> <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{round.meeting_link}</a></p>
                            )}
                            {round.location_type === 'offline' && round.location && (
                                <p className="text-slate-700"><strong>Location:</strong> {round.location}</p>
                            )}
                            <p className="text-slate-700"><strong>Attended:</strong> {round.candidate_attended}</p>
                            <p className="text-slate-700"><strong>Outcome:</strong> {round.interview_outcome}</p>
                            {round.scores && (
                                <div className="mt-2 pt-2 border-t border-slate-300">
                                    <p className="font-medium text-slate-900 mb-1">Scores:</p>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                            <p key={key} className="text-slate-700"><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}/5</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {round.reason && (
                                <p className="text-slate-700 mt-1"><strong>Reason:</strong> {round.reason}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Status Dropdown - Only show if not in view-only mode and not in ongoing rounds */}
            {!isViewOnly && applicant.status !== 'processing' && (
                <div className="mb-3">
                    <select
                        value={applicant.status || 'decision_pending'}
                        onChange={(e) => onStatusChange(applicant.email, e.target.value)}
                        disabled={updatingStatus}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {updatingStatus && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-2"></div>
                    )}
                </div>
            )}

            {/* View Details Button */}
            {(applicant.resume_url || applicant.additional_details || applicant.profile?.additional_details) && (
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                >
                    <FileText className="w-4 h-4" />
                    {showDetails ? 'Hide' : 'View'} Details
                </button>
            )}

            {/* Additional Details */}
            {showDetails && (applicant.additional_details || applicant.profile?.additional_details) && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">AI Comparison Details</h4>
                    <div className="text-xs text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                        {applicant.additional_details || applicant.profile?.additional_details}
                    </div>
                </div>
            )}

            {/* Resume Link */}
            {(applicant.resume_url || applicant.profile?.resume_url) && (
                <a
                    href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                    <Download className="w-3 h-3" />
                    View Resume
                </a>
            )}
        </div>
    );
};

