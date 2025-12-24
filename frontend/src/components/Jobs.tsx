import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, DollarSign, FileText,
    CheckCircle, AlertCircle, UserCheck, LogOut, Building2
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
}

// --- Helper Components ---

const JobCard = ({
    job,
    onApply,
    isApplied,
    applicationStatus,
    showApplyButton = true,
    isProcessing = false
}: {
    job: JobPost;
    onApply?: (jobId: string) => void;
    isApplied: boolean;
    applicationStatus?: string;
    showApplyButton?: boolean;
    isProcessing?: boolean;
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{job.role}</h3>
                    <p className="text-slate-600 mb-1 font-medium">{job.company.name}</p>
                    <p className="text-sm text-slate-500">{job.company.email}</p>
                </div>
                <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        job.job_type === 'full_time' ? 'bg-blue-100 text-blue-800' :
                        job.job_type === 'internship' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
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
                    <span className="text-sm text-slate-700">Apply by: {formatDate(job.application_close_date)}</span>
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

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <a
                        href={`${API_ENDPOINTS.JOBS.replace('/api/jobs', '')}${job.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        View Job Description
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">
                        {applicationStatus ? (
                            <span className="inline-flex items-center gap-1">
                                Status: <span className="font-medium text-blue-600 capitalize">{applicationStatus}</span>
                            </span>
                        ) : (
                            `Posted ${formatDate(job.created_at)}`
                        )}
                    </div>

                    {showApplyButton && (
                        <button
                            onClick={() => onApply?.(job.job_id)}
                            disabled={isApplied || isProcessing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                isApplied || isProcessing
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : isApplied ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Applied
                                </>
                            ) : (
                                <>
                                    <UserCheck className="w-4 h-4" />
                                    Apply
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function Jobs() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [appliedJobs, setAppliedJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [processingJobId, setProcessingJobId] = useState<string | null>(null);

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
            if (parsedUser.user_type !== 'user') {
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
            // Fetch both all jobs and applied jobs
            const [allJobsRes, appliedJobsRes] = await Promise.all([
                authenticatedFetch(API_ENDPOINTS.JOBS, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.JOBS_APPLIED, { method: 'GET' }, navigate)
            ]);

            // First, get applied jobs to create a set of applied job IDs
            const appliedJobIdsSet = new Set<string>();
            if (appliedJobsRes && appliedJobsRes.ok) {
                const appliedResult = await appliedJobsRes.json();
                const appliedJobsList = appliedResult.jobs || [];
                appliedJobsList.forEach((appliedJob: any) => {
                    if (appliedJob.job_id) {
                        appliedJobIdsSet.add(appliedJob.job_id);
                    }
                });
                setAppliedJobs(appliedJobsList);
                setAppliedJobIds(appliedJobIdsSet);
            }

            // Handle all jobs - filter out any jobs that are in the applied jobs list
            if (allJobsRes && allJobsRes.ok) {
                const result = await allJobsRes.json();
                const openJobs = result.jobs || [];

                // Filter out applied jobs from the all jobs list
                const unappliedJobs = openJobs.filter((job: JobPost) => 
                    !appliedJobIdsSet.has(job.job_id)
                );

                setJobs(unappliedJobs);
            } else if (allJobsRes && allJobsRes.status === 401) {
                clearAuthAndRedirect(navigate);
                return;
            }

            setMessage(null);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setMessage({ type: 'error', text: 'Error loading jobs' });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: string) => {
        if (!userData || processingJobId) return; // Prevent multiple clicks

        setProcessingJobId(jobId); // Set processing state
        setMessage(null);

        try {
            const res = await authenticatedFetch(
                `${API_ENDPOINTS.ORGANIZATION_JOBPOST}/${jobId}/apply`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: userData.name,
                        email: userData.email
                    })
                },
                navigate
            );

            if (!res) {
                setProcessingJobId(null);
                return;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Successfully applied for the job! Processing your application...' });
                // Remove job from all jobs list (it will appear in applied jobs)
                const appliedJob = jobs.find(job => job.job_id === jobId);
                setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
                // Add to applied job IDs set
                setAppliedJobIds(prev => new Set([...prev, jobId]));
                // Add to applied jobs list with status
                if (appliedJob) {
                    setAppliedJobs(prev => [...prev, { ...appliedJob, application_status: 'applied' }]);
                }
                
                // Refresh applied jobs to get the latest data with additional_details after processing
                setTimeout(async () => {
                    try {
                        const appliedRes = await authenticatedFetch(API_ENDPOINTS.JOBS_APPLIED, { method: 'GET' }, navigate);
                        if (appliedRes && appliedRes.ok) {
                            const result = await appliedRes.json();
                            setAppliedJobs(result.jobs || []);
                            setMessage({ type: 'success', text: 'Application submitted successfully!' });
                        }
                    } catch (err) {
                        console.error('Failed to refresh applied jobs:', err);
                    }
                }, 3000);
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to apply for the job' });
            }
        } catch (err) {
            console.error('Failed to apply for job:', err);
            setMessage({ type: 'error', text: 'Error applying for the job' });
        } finally {
            setProcessingJobId(null);
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
        navigate("/");
    };

    if (loading && jobs.length === 0 && appliedJobs.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading jobs...</p>
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
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-slate-900">Available Jobs</h1>
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
                            onClick={() => navigate('/user-profile')}
                            className="px-4 py-2 rounded-lg font-medium text-black hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            Profile
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

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'all', label: 'All Jobs', count: jobs.length },
                                { id: 'applied', label: 'Applied Jobs', count: appliedJobs.length }
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
                    if (activeTab === 'all') {
                        return jobs.length === 0 ? (
                            <div className="text-center py-12">
                                <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">No jobs available</h3>
                                <p className="text-slate-500 mb-6">There are no open job positions at the moment. Check back later!</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-slate-800">
                                        Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
                                    </h2>
                                    <p className="text-slate-600">Apply to positions that match your skills and interests</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {jobs.map((job) => (
                                        <JobCard
                                            key={job.job_id}
                                            job={job}
                                            onApply={handleApply}
                                            isApplied={appliedJobIds.has(job.job_id)}
                                            isProcessing={processingJobId === job.job_id}
                                        />
                                    ))}
                                </div>
                            </>
                        );
                    } else {
                        return appliedJobs.length === 0 ? (
                            <div className="text-center py-12">
                                <UserCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">No applied jobs</h3>
                                <p className="text-slate-500 mb-6">You haven't applied to any jobs yet. Browse available jobs to get started!</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-slate-800">
                                        Your Applications ({appliedJobs.length})
                                    </h2>
                                    <p className="text-slate-600">Track the status of jobs you've applied to</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {appliedJobs.map((job) => (
                                        <JobCard
                                            key={job.job_id}
                                            job={job}
                                            onApply={undefined}
                                            isApplied={true}
                                            applicationStatus={job.application_status}
                                            showApplyButton={false}
                                        />
                                    ))}
                                </div>
                            </>
                        );
                    }
                })()}
            </div>
        </div>
    );
}
