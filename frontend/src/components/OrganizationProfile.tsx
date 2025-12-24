import React, { useState, useEffect } from 'react';
import {
    Pencil, Save, X, Upload, CheckCircle, MapPin, Mail, Phone,
    Briefcase, Globe, Users, Building2, Calendar, FileText, LogOut, Linkedin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// --- Types ---

interface Employee {
    name: string;
    role: string;
    resumeFile?: File | null;
    resumeUrl?: string;
    parsedResumeData?: any; // Store parsed resume data
}

interface OrganizationProfileData {
    // Basic Info
    companyName: string;
    industry: string;
    companySize: string;
    foundedYear: string;
    website: string;
    email: string;
    phone: string;
    location: string;

    // Description
    description: string;

    // Logo
    logo: File | null;
    logoUrl: string;

    // Social Links
    linkedinUrl: string;
    twitterUrl: string;

    // Employees
    employees: Employee[];
}

// --- Initial Data ---

const INITIAL_DATA: OrganizationProfileData = {
    companyName: "",
    industry: "Technology",
    companySize: "1-10",
    foundedYear: new Date().getFullYear().toString(),
    website: "",
    email: "",
    phone: "",
    location: "",
    description: "",
    logo: null,
    logoUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    employees: []
};

// --- Helper Components ---

const SectionCard = ({
    title,
    icon: Icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    loading = false,
    children
}: {
    title: string;
    icon?: any;
    isEditing: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    loading?: boolean;
    children: React.ReactNode;
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-blue-600" />}
                    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                </div>
                {!isEditing && onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            disabled={loading}
                            className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save
                                </>
                            )}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-700 bg-slate-100 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                )}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

// --- Main Component ---

export function OrganizationProfile() {
    const navigate = useNavigate();
    const [data, setData] = useState<OrganizationProfileData>(INITIAL_DATA);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        // Check if user is actually an organization (not user)
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/user-profile');
                return;
            }
            setData(prev => ({ ...prev, email: parsedUser.email, companyName: parsedUser.name || prev.companyName }));
        }

        // Fetch profile data
        const fetchProfile = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.ORGANIZATION_PROFILE,
                    {
                        method: 'GET'
                    },
                    navigate
                );

                if (!res) {
                    // Already redirected by authenticatedFetch
                    return;
                }

                if (res.ok) {
                    const result = await res.json();
                    if (result.profile) {
                        // Map backend fields to frontend fields
                        const mappedData = {
                            companyName: result.profile.name || '',
                            email: result.profile.email || '',
                            logoUrl: result.profile.logo_path || '',
                            industry: result.profile.category || 'Technology',
                            companySize: result.profile.company_size || '1-10',
                            foundedYear: result.profile.founded || new Date().getFullYear().toString(),
                            website: result.profile.website || '',
                            phone: result.profile.number || '',
                            location: result.profile.location || '',
                            description: result.profile.about_company || '',
                            linkedinUrl: result.profile.linkedin_link || '',
                            twitterUrl: result.profile.instagram_link || '',
                            logo: null,
                            employees: (result.profile.employees_details || []).map((emp: any) => ({
                                name: emp.name || '',
                                role: emp.role || '',
                                resumeUrl: emp.resume_url || '',
                                parsedResumeData: emp.parsed_resume_data || null
                            }))
                        };
                        setData(prev => ({ ...prev, ...mappedData }));
                    }
                } else if (res.status === 401) {
                    // Unauthorized - redirect to auth
                    clearAuthAndRedirect(navigate);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                clearAuthAndRedirect(navigate);
            }
        };

        fetchProfile();
    }, [navigate]);

    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Forms State (temporary state while editing)
    const [tempData, setTempData] = useState<OrganizationProfileData>(INITIAL_DATA);

    const startEditing = (section: string) => {
        setTempData({ ...data });
        setEditingSection(section);
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setTempData(INITIAL_DATA);
    };

    const saveToBackend = async (dataToSave: OrganizationProfileData) => {
        setLoading(true);
        setMessage(null);
        try {
            // Ensure we store only the relative path (e.g., /static/uploads/...)
            const logoPath = dataToSave.logoUrl
                ? dataToSave.logoUrl.replace(/^https?:\/\/[^/]+/, '')
                : '';

            // Map frontend fields to backend schema
            const employeesForBackend = (dataToSave.employees || []).map(emp => ({
                name: emp.name,
                role: emp.role,
                resume_url: emp.resumeUrl || '',
                parsed_resume_data: emp.parsedResumeData || null
            }));

            const backendData = {
                name: dataToSave.companyName,
                email: dataToSave.email,
                logo_path: logoPath,
                category: dataToSave.industry,
                company_size: dataToSave.companySize,
                website: dataToSave.website,
                number: dataToSave.phone,
                founded: dataToSave.foundedYear,
                location: dataToSave.location,
                about_company: dataToSave.description,
                linkedin_link: dataToSave.linkedinUrl,
                instagram_link: dataToSave.twitterUrl,
                employees_details: employeesForBackend
            };

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_PROFILE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendData)
                },
                navigate
            );

            if (!res) {
                // Already redirected by authenticatedFetch
                return false;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile saved successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: 'Failed to save profile' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving profile' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const saveSection = async (section?: string) => {
        setLoading(true);
        setMessage(null);
        
        let newData = { ...data, ...tempData };

        // Handle logo upload if a new file was selected (only for basic section)
        if ((section === 'basic' || !section) && tempData.logo instanceof File) {
            try {
                const formData = new FormData();
                formData.append('file', tempData.logo);

                const uploadRes = await authenticatedFetch(
                    API_ENDPOINTS.UPLOAD,
                    {
                        method: 'POST',
                        body: formData
                    },
                    navigate
                );

                if (!uploadRes) {
                    setLoading(false);
                    return;
                }

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    newData.logoUrl = uploadData.url;
                    newData.logo = null; // Clear file object after upload
                } else {
                    console.error("Upload failed");
                    setMessage({ type: 'error', text: 'Failed to upload logo' });
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Upload error", err);
                setMessage({ type: 'error', text: 'Error uploading logo' });
                setLoading(false);
                return;
            }
        }

        // Handle employee resume uploads and parsing (one by one) - ONLY when saving
        if (section === 'employees' || !section) {
            const employeesWithFiles = tempData.employees.filter((emp, idx) => emp.resumeFile instanceof File);
            
            if (employeesWithFiles.length > 0) {
                setMessage({ type: 'success', text: `Processing ${employeesWithFiles.length} resume(s)...` });
                
                // Process each employee one by one
                for (let i = 0; i < tempData.employees.length; i++) {
                    const employee = tempData.employees[i];
                    
                    // If there's a file that hasn't been processed yet, process it now
                    if (employee.resumeFile instanceof File) {
                        setMessage({ type: 'success', text: `Processing resume for ${employee.name || `Employee ${i + 1}`} (${i + 1}/${employeesWithFiles.length})...` });
                        
                        const result = await processEmployeeResume(i, employee.resumeFile);
                        
                        if (result) {
                            // Update employee data with URL and parsed data
                            newData.employees[i] = {
                                ...newData.employees[i],
                                resumeUrl: result.resumeUrl,
                                resumeFile: null,
                                parsedResumeData: result.parsedData || newData.employees[i].parsedResumeData || null
                            };
                        } else {
                            // If processing failed, keep the file so user can try again
                            setMessage({ type: 'error', text: `Failed to process resume for ${employee.name || `Employee ${i + 1}`}. Please try again.` });
                            // Don't update this employee, keep the file
                            continue;
                        }
                    }
                }
                
                setMessage({ type: 'success', text: 'All resumes processed successfully!' });
            }
        }

        // Create a clean copy for storage - remove File object
        const finalData = { ...newData };
        if (finalData.logo instanceof File) {
            // @ts-ignore
            finalData.logo = null;
        }
        
        // Prepare employees data for backend (remove File objects, keep parsed data)
        const employeesForBackend = finalData.employees.map(emp => ({
            name: emp.name,
            role: emp.role,
            resume_url: emp.resumeUrl || '',
            parsed_resume_data: emp.parsedResumeData || null
        }));

        setData(newData);
        const saved = await saveToBackend(finalData);
        
        if (saved) {
            setEditingSection(null);
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
        }
        
        setLoading(false);
    };

    const processEmployeeResume = async (index: number, file: File): Promise<{ resumeUrl: string; parsedData: any } | null> => {
        try {
            // Step 1: Upload the file first to get the URL
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await authenticatedFetch(
                API_ENDPOINTS.UPLOAD,
                {
                    method: 'POST',
                    body: uploadFormData
                },
                navigate
            );

            if (!uploadRes || !uploadRes.ok) {
                console.error("Resume upload failed for employee", index);
                return null;
            }

            const uploadData = await uploadRes.json();
            const resumeUrl = uploadData.url;

            // Step 2: Parse the resume using the uploaded file
            const parseFormData = new FormData();
            parseFormData.append('file', file);

            const parseRes = await authenticatedFetch(
                API_ENDPOINTS.PARSE_RESUME,
                {
                    method: 'POST',
                    body: parseFormData
                },
                navigate
            );

            // Step 3: Return URL and parsed data
            if (parseRes && parseRes.ok) {
                const result = await parseRes.json();
                return {
                    resumeUrl: resumeUrl,
                    parsedData: result.parsed_data
                };
            } else {
                // If parsing fails, still return the URL
                return {
                    resumeUrl: resumeUrl,
                    parsedData: null
                };
            }
        } catch (err) {
            console.error(`Error processing resume for employee ${index}:`, err);
            return null;
        }
    };

    const handleTempChange = (field: keyof OrganizationProfileData, value: any) => {
        setTempData(prev => ({ ...prev, [field]: value }));
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

    const handleGlobalSubmit = async () => {
        if (!data.companyName) {
            setMessage({ type: 'error', text: 'Company name is required' });
            return;
        }
        await saveToBackend(data);
    };

    // --- Render Functions ---

    const renderBasicInfo = () => {
        const isEditing = editingSection === 'basic';

        if (isEditing) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden relative">
                            {tempData.logoUrl ? (
                                <img 
                                    src={tempData.logoUrl.startsWith('http') ? tempData.logoUrl : `${API_BASE_URL}${tempData.logoUrl}`} 
                                    alt="Logo" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <Building2 className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo</label>
                            <input
                                type="file"
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setTempData(prev => ({ ...prev, logo: file, logoUrl: url }));
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Company Name *</label>
                        <input
                            type="text"
                            className="input-field bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={tempData.companyName}
                            readOnly
                            disabled
                        />
                    </div>
                    <div>
                        <label className="label">Industry</label>
                        <select
                            className="input-field"
                            value={tempData.industry}
                            onChange={e => handleTempChange('industry', e.target.value)}
                        >
                            <option>Technology</option>
                            <option>Healthcare</option>
                            <option>Finance</option>
                            <option>Education</option>
                            <option>Retail</option>
                            <option>Manufacturing</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Company Size</label>
                        <select
                            className="input-field"
                            value={tempData.companySize}
                            onChange={e => handleTempChange('companySize', e.target.value)}
                        >
                            <option>1-10</option>
                            <option>11-50</option>
                            <option>51-200</option>
                            <option>201-500</option>
                            <option>501-1000</option>
                            <option>1000+</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Founded Year</label>
                        <input
                            type="number" className="input-field"
                            value={tempData.foundedYear}
                            onChange={e => handleTempChange('foundedYear', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Website</label>
                        <input
                            type="url" className="input-field"
                            value={tempData.website}
                            onChange={e => handleTempChange('website', e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input-field bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={tempData.email}
                            readOnly
                            disabled
                        />
                    </div>
                    <div>
                        <label className="label">Phone</label>
                        <input
                            type="tel" className="input-field"
                            value={tempData.phone}
                            onChange={e => handleTempChange('phone', e.target.value)}
                        />
                    </div>
                    <div className="col-span-full">
                        <label className="label">Location</label>
                        <input
                            type="text" className="input-field"
                            value={tempData.location}
                            onChange={e => handleTempChange('location', e.target.value)}
                            placeholder="City, State, Country"
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {data.logoUrl ? (
                            <img 
                                src={data.logoUrl.startsWith('http') ? data.logoUrl : `${API_BASE_URL}${data.logoUrl}`} 
                                alt="Logo" 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <Building2 className="w-10 h-10 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{data.companyName || 'Company Name'}</h3>
                        <p className="text-sm text-slate-600">{data.industry}</p>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Company Size</p>
                        <p className="text-slate-900">{data.companySize} employees</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Founded</p>
                        <p className="text-slate-900">{data.foundedYear}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Globe className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Website</p>
                        <a href={data.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            {data.website || 'Not provided'}
                        </a>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Email</p>
                        <p className="text-slate-900">{data.email}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Phone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Phone</p>
                        <p className="text-slate-900">{data.phone || 'Not provided'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 col-span-full">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Location</p>
                        <p className="text-slate-900">{data.location || 'Not provided'}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderDescription = () => {
        const isEditing = editingSection === 'description';

        if (isEditing) {
            return (
                <div>
                    <label className="label">Company Description</label>
                    <textarea
                        className="input-field min-h-[150px]"
                        value={tempData.description}
                        onChange={e => handleTempChange('description', e.target.value)}
                        placeholder="Tell us about your company..."
                    />
                </div>
            );
        }

        return (
            <div>
                <p className="text-slate-700 whitespace-pre-wrap">
                    {data.description || 'No description provided.'}
                </p>
            </div>
        );
    };

    const renderLinks = () => {
        const isEditing = editingSection === 'links';

        if (isEditing) {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="label">LinkedIn URL</label>
                        <input
                            type="url" className="input-field"
                            value={tempData.linkedinUrl}
                            onChange={e => handleTempChange('linkedinUrl', e.target.value)}
                            placeholder="https://linkedin.com/company/..."
                        />
                    </div>
                    <div>
                        <label className="label">Twitter URL</label>
                        <input
                            type="url" className="input-field"
                            value={tempData.twitterUrl}
                            onChange={e => handleTempChange('twitterUrl', e.target.value)}
                            placeholder="https://twitter.com/..."
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {data.linkedinUrl && (
                    <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Linkedin className="w-4 h-4" /> {data.linkedinUrl}
                    </a>
                )}
                {data.twitterUrl && (
                    <a href={data.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Globe className="w-4 h-4" /> {data.twitterUrl}
                    </a>
                )}
                {!data.linkedinUrl && !data.twitterUrl && <p className="text-slate-500 italic">No links added.</p>}
            </div>
        );
    };

    const renderEmployees = () => {
        const isEditing = editingSection === 'employees';

        if (isEditing) {
            return (
                <div className="space-y-4">
                    {tempData.employees.map((employee, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Employee Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={employee.name}
                                        onChange={e => {
                                            const updated = [...tempData.employees];
                                            updated[index] = { ...updated[index], name: e.target.value };
                                            setTempData(prev => ({ ...prev, employees: updated }));
                                        }}
                                        placeholder="Enter employee name"
                                    />
                                </div>
                                <div>
                                    <label className="label">Role/Designation</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={employee.role}
                                        onChange={e => {
                                            const updated = [...tempData.employees];
                                            updated[index] = { ...updated[index], role: e.target.value };
                                            setTempData(prev => ({ ...prev, employees: updated }));
                                        }}
                                        placeholder="Enter role/designation"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Resume File</label>
                                {employee.resumeUrl && !employee.resumeFile && (
                                    <div className="mb-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                                        Current file: {employee.resumeUrl}
                                        {employee.parsedResumeData ? (
                                            <span className="ml-2 text-green-600">✓ Parsed</span>
                                        ) : (
                                            <span className="ml-2 text-orange-600">⚠ Not parsed</span>
                                        )}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    disabled={loading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const updated = [...tempData.employees];
                                            updated[index] = { ...updated[index], resumeFile: file };
                                            setTempData(prev => ({ ...prev, employees: updated }));
                                        }
                                    }}
                                />
                                {employee.resumeFile && (
                                    <p className="text-xs text-blue-600 mt-1">Processing: {employee.resumeFile.name}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setTempData(prev => ({
                                ...prev,
                                employees: [...prev.employees, { name: '', role: '', resumeFile: null }]
                            }));
                        }}
                        disabled={loading}
                        className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Add Employee
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {data.employees.length === 0 ? (
                    <p className="text-slate-500 italic">No employees added yet.</p>
                ) : (
                    data.employees.map((employee, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">{employee.name}</p>
                                <p className="text-sm text-slate-600">{employee.role}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-900">Organization Profile</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                        <button
                            onClick={handleGlobalSubmit}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                'Save Profile'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`max-w-5xl mx-auto mt-4 px-6 py-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">

                <SectionCard
                    title="Company Information"
                    icon={Building2}
                    isEditing={editingSection === 'basic'}
                    onEdit={() => startEditing('basic')}
                    onSave={() => saveSection('basic')}
                    onCancel={cancelEditing}
                    loading={loading}
                >
                    {renderBasicInfo()}
                </SectionCard>

                <SectionCard
                    title="About Company"
                    icon={FileText}
                    isEditing={editingSection === 'description'}
                    onEdit={() => startEditing('description')}
                    onSave={() => saveSection('description')}
                    onCancel={cancelEditing}
                    loading={loading}
                >
                    {renderDescription()}
                </SectionCard>

                <SectionCard
                    title="Social Links"
                    icon={Globe}
                    isEditing={editingSection === 'links'}
                    onEdit={() => startEditing('links')}
                    onSave={() => saveSection('links')}
                    onCancel={cancelEditing}
                    loading={loading}
                >
                    {renderLinks()}
                </SectionCard>

                <SectionCard
                    title="Our Employees"
                    icon={Users}
                    isEditing={editingSection === 'employees'}
                    onEdit={() => startEditing('employees')}
                    onSave={() => saveSection('employees')}
                    onCancel={cancelEditing}
                    loading={loading}
                >
                    {renderEmployees()}
                </SectionCard>

            </div>

            <style>{`
        .label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #334155;
            margin-bottom: 0.25rem;
        }
        .input-field {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #CBD5E1;
            background-color: #F8FAFC;
            transition: all 0.2s;
        }
        .input-field:focus {
            outline: none;
            border-color: #3B82F6;
            background-color: white;
        }
      `}</style>
        </div>
    );
}
