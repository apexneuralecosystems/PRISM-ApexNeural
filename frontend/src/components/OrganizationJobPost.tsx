import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, X, FileText, MapPin, Users, Calendar,
    DollarSign, CheckCircle, AlertCircle, Upload, LogOut, Building2,
    ChevronDown, ChevronRight, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

// --- Types ---

interface JobPost {
    job_id: string;
    company: {
        name: string;
        email: string;
    };
    role: string;
    file_path: string;
    location: string;
    number_of_openings: number;
    application_close_date: string;
    job_package_lpa: number;
    job_type: string;
    notes: string;
    applied_candidates: any[];
    created_at: string;
    closed_at?: string;
}

// --- Helper Components ---

const JobCard = ({
    job,
    status,
    onClose,
    onViewApplicants
}: {
    job: JobPost;
    status: 'open' | 'ongoing' | 'closed';
    onClose?: (jobId: string) => void;
    onViewApplicants?: (job: JobPost) => void;
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getJobTypeLabel = (type: string) => {
        switch (type) {
            case 'full_time': return 'Full Time';
            case 'internship': return 'Internship';
            case 'unpaid': return 'Unpaid';
            default: return type;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{job.role}</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-slate-600">{job.company.name}</p>
                        {job.applied_candidates && job.applied_candidates.length > 0 && onViewApplicants && (
                            <button
                                onClick={() => onViewApplicants(job)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Eye className="w-3 h-3" />
                                {job.applied_candidates.length} applicant{job.applied_candidates.length !== 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getJobTypeLabel(job.job_type)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{job.number_of_openings} openings</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Closes: {formatDate(job.application_close_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{job.job_package_lpa} LPA</span>
                </div>
            </div>

            {job.notes && (
                <div className="mb-4">
                    <p className="text-sm text-slate-600">{job.notes}</p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <a
                        href={`${API_ENDPOINTS.ORGANIZATION_JOBPOST.replace('/api/organization-jobpost', '')}${job.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        View Job Description
                    </a>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'ongoing' && onClose && (
                        <button
                            onClick={() => onClose(job.job_id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Close Job
                        </button>
                    )}
                    <div className="text-xs text-slate-500">
                        {status === 'closed' && job.closed_at ?
                            `Closed ${formatDate(job.closed_at)}` :
                            `Posted ${formatDate(job.created_at)}`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Applicants Modal Component ---

const ApplicantsModal = ({
    job,
    isOpen,
    onClose
}: {
    job: JobPost | null;
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!isOpen || !job) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">{job.role}</h2>
                        <p className="text-slate-600">{job.company.name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                            {job.applied_candidates?.length || 0} applicants
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {job.applied_candidates && job.applied_candidates.length > 0 ? (
                        <div className="space-y-3">
                            {job.applied_candidates.map((candidate: any, index: number) => (
                                <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-slate-800">{candidate.name}</h4>
                                            <p className="text-sm text-slate-600">{candidate.email}</p>
                                        </div>
                                        {candidate.applied_at && (
                                            <p className="text-xs text-slate-500">
                                                Applied on {formatDate(candidate.applied_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                No applicants yet
                            </h3>
                            <p className="text-slate-500">
                                Applicants will appear here once candidates apply for this job.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function OrganizationJobPost() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'open' | 'ongoing' | 'closed'>('open');
    const [jobs, setJobs] = useState<{open: JobPost[], ongoing: JobPost[], closed: JobPost[]}>({
        open: [],
        ongoing: [],
        closed: []
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);
    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<JobPost | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        role: '',
        location: '',
        number_of_openings: 1,
        application_close_date: '',
        job_package_lpa: 0,
        job_type: 'full_time',
        notes: '',
        jd_file: null as File | null
    });

    useEffect(() => {
        // Check authentication and user type
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/');
            return;
        }

        if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/');
                return;
            }
            setUserData(parsedUser);
        }

        // Fetch jobs data
        fetchAllJobs();
    }, [navigate]);

    const fetchAllJobs = async () => {
        try {
            // Fetch jobs from all three collections
            const [openRes, ongoingRes, closedRes] = await Promise.all([
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST_ONGOING, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST_CLOSED, { method: 'GET' }, navigate)
            ]);

            const newJobs = { open: [], ongoing: [], closed: [] } as {open: JobPost[], ongoing: JobPost[], closed: JobPost[]};

            // Handle open jobs
            if (openRes && openRes.ok) {
                const result = await openRes.json();
                newJobs.open = result.jobs || [];
            } else if (openRes && openRes.status === 401) {
                clearAuthAndRedirect(navigate);
                return;
            }

            // Handle ongoing jobs
            if (ongoingRes && ongoingRes.ok) {
                const result = await ongoingRes.json();
                newJobs.ongoing = result.jobs || [];
            }

            // Handle closed jobs
            if (closedRes && closedRes.ok) {
                const result = await closedRes.json();
                newJobs.closed = result.jobs || [];
            }

            setJobs(newJobs);
            setMessage(null); // Clear any error messages on successful fetch

        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setMessage({ type: 'error', text: 'Error loading job postings' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, jd_file: file }));
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.role.trim()) {
            setMessage({ type: 'error', text: 'Role is required' });
            return;
        }
        if (!formData.location.trim()) {
            setMessage({ type: 'error', text: 'Location is required' });
            return;
        }
        if (!formData.application_close_date) {
            setMessage({ type: 'error', text: 'Application close date is required' });
            return;
        }
        if (formData.job_package_lpa <= 0) {
            setMessage({ type: 'error', text: 'Job package must be greater than 0' });
            return;
        }
        if (!formData.jd_file) {
            setMessage({ type: 'error', text: 'Job description file is required' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('role', formData.role);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('number_of_openings', formData.number_of_openings.toString());
            formDataToSend.append('application_close_date', formData.application_close_date);
            formDataToSend.append('job_package_lpa', formData.job_package_lpa.toString());
            formDataToSend.append('job_type', formData.job_type);
            formDataToSend.append('notes', formData.notes);
            formDataToSend.append('jd_file', formData.jd_file);

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_JOBPOST,
                {
                    method: 'POST',
                    body: formDataToSend
                },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setMessage({ type: 'success', text: 'Job posting created successfully!' });
                setShowForm(false);
                // Reset form
                setFormData({
                    role: '',
                    location: '',
                    number_of_openings: 1,
                    application_close_date: '',
                    job_package_lpa: 0,
                    job_type: 'full_time',
                    notes: '',
                    jd_file: null
                });
                // Refresh jobs list
                fetchAllJobs();
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to create job posting' });
            }
        } catch (err) {
            console.error('Failed to create job post:', err);
            setMessage({ type: 'error', text: 'Error creating job posting' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewApplicants = (job: JobPost) => {
        setSelectedJobForApplicants(job);
        setShowApplicantsModal(true);
    };

    const handleCloseApplicantsModal = () => {
        setShowApplicantsModal(false);
        setSelectedJobForApplicants(null);
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
        navigate("/");
    };

    const handleCloseJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to close this job posting? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await authenticatedFetch(
                `${API_ENDPOINTS.ORGANIZATION_JOBPOST}/${jobId}/close`,
                { method: 'PUT' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                setMessage({ type: 'success', text: 'Job posting closed successfully!' });
                // Refresh jobs list
                fetchAllJobs();
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to close job posting' });
            }
        } catch (err) {
            console.error('Failed to close job:', err);
            setMessage({ type: 'error', text: 'Error closing job posting' });
        } finally {
            setLoading(false);
        }
    };

    const handleManageJobStatus = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_MANAGE_JOB_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const result = await res.json();
                setMessage({ type: 'success', text: result.message });
                // Refresh jobs list
                fetchAllJobs();
            } else {
                setMessage({ type: 'error', text: 'Failed to update job statuses' });
            }
        } catch (err) {
            console.error('Failed to manage job status:', err);
            setMessage({ type: 'error', text: 'Error updating job statuses' });
        } finally {
            setLoading(false);
        }
    };


    if (loading && jobs.open.length === 0 && jobs.ongoing.length === 0 && jobs.closed.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading job postings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-slate-900">Job Postings</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-black hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                        <button
                            onClick={() => navigate('/organization-profile')}
                            className="px-4 py-2 rounded-lg font-medium text-black hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => navigate('/organization-team')}
                            className="px-4 py-2 rounded-lg font-medium text-black hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            Teams
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Post Job
                        </button>
                        <button
                            onClick={handleManageJobStatus}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-all text-sm"
                            title="Move expired jobs to ongoing"
                        >
                            🔄 Update Status
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`max-w-6xl mx-auto mt-4 px-6 py-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Job Posting Form */}
            {showForm && (
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-slate-800">Create Job Posting</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Job Role *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Software Engineer"
                                        required
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Bangalore, India"
                                        required
                                    />
                                </div>

                                {/* Number of Openings */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Number of Openings *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.number_of_openings}
                                        onChange={(e) => handleInputChange('number_of_openings', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Application Close Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Application Close Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.application_close_date}
                                        onChange={(e) => handleInputChange('application_close_date', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Job Package */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Job Package (LPA) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.job_package_lpa}
                                        onChange={(e) => handleInputChange('job_package_lpa', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., 4.5"
                                        required
                                    />
                                </div>

                                {/* Job Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Job Type *
                                    </label>
                                    <select
                                        value={formData.job_type}
                                        onChange={(e) => handleInputChange('job_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="full_time">Full Time</option>
                                        <option value="internship">Internship</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                            </div>

                            {/* Job Description File */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Job Description File *
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="jd-file"
                                        required
                                    />
                                    <label
                                        htmlFor="jd-file"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Choose File
                                    </label>
                                    {formData.jd_file && (
                                        <span className="text-sm text-slate-600">
                                            {formData.jd_file.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Supported formats: PDF, DOC, DOCX
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Any additional information about the job..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-black hover:bg-slate-100 rounded-lg transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Briefcase className="w-4 h-4" />
                                            Create Job Posting
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            {!showForm && (
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="border-b border-slate-200">
                            <nav className="-mb-px flex space-x-8">
                                {[
                                    { id: 'open', label: 'Open Jobs', count: jobs.open.length },
                                    { id: 'ongoing', label: 'Ongoing Jobs', count: jobs.ongoing.length },
                                    { id: 'closed', label: 'Closed Jobs', count: jobs.closed.length }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Job Listings */}
                    {(() => {
                        const currentJobs = jobs[activeTab];
                        return currentJobs.length === 0 ? (
                            <div className="text-center py-12">
                                <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                                    No {activeTab} job postings
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    {activeTab === 'open' && "Create job postings to attract talented candidates"}
                                    {activeTab === 'ongoing' && "Jobs with expired deadlines will appear here"}
                                    {activeTab === 'closed' && "Closed job postings will appear here"}
                                </p>
                                {activeTab === 'open' && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Your First Job Posting
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {currentJobs.map((job) => (
                                    <JobCard
                                        key={job.job_id}
                                        job={job}
                                        status={activeTab}
                                        onClose={activeTab === 'ongoing' ? handleCloseJob : undefined}
                                        onViewApplicants={handleViewApplicants}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Applicants Modal */}
            <ApplicantsModal
                job={selectedJobForApplicants}
                isOpen={showApplicantsModal}
                onClose={handleCloseApplicantsModal}
            />
        </div>
    );
}
