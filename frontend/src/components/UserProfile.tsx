
import React, { useState, useEffect } from 'react';
import {
    Pencil, Plus, Trash2, X,
    Upload, CheckCircle, MapPin, Mail, Phone,
    Briefcase, GraduationCap, Award, Globe, Github, Linkedin, FileText, LogOut
} from 'lucide-react';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// --- Types ---

interface Education {
    id: string;
    institute: string;
    degree: string;
    specialization: string;
    startDate: string;
    endDate: string;
    gradeType: 'Percentage' | 'CGPA';
    gradeValue: string;
}

interface Experience {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
}

interface Language {
    id: string;
    name: string;
    canSpeak: boolean;
    canRead: boolean;
    canWrite: boolean;
}

interface Certification {
    id: string;
    name: string;
    organization: string;
    url: string;
    expiryDate: string;
    doesNotExpire: boolean;
}

interface UserProfileData {
    // Basic Info
    fullName: string;
    gender: string;
    dob: string;
    location: string;
    phone: string;
    email: string;
    profilePhoto: File | null;
    profilePhotoUrl: string;

    // Summary
    summary: string;

    // Collections
    education: Education[];
    skills: string[]; // Custom + Predefined
    languages: Language[];
    experience: Experience[];
    certifications: Certification[];

    // Others
    resume: File | null;
    resumeName: string;
    resumeUrl: string;
    githubUrl: string;
    linkedinUrl: string;
}

// --- Initial Data ---

const INITIAL_DATA: UserProfileData = {
    fullName: "Akshaay KG",
    gender: "Male",
    dob: "2000-01-01",
    location: "Bhopal, MP, India",
    phone: "+91 9876543210",
    email: "akshaay.kg2021@vitbhopal.ac.in",
    profilePhoto: null, // Would be a URL in real app
    profilePhotoUrl: "",

    summary: "Passionate Full Stack Developer with experience in building scalable web applications.",

    education: [
        {
            id: '1',
            institute: 'VIT Bhopal University',
            degree: 'B.Tech',
            specialization: 'Computer Science',
            startDate: '2021-08-01',
            endDate: '2025-05-01',
            gradeType: 'CGPA',
            gradeValue: '9.2'
        }
    ],

    skills: ['React', 'Python', 'FastAPI'],

    languages: [
        { id: '1', name: 'English', canSpeak: true, canRead: true, canWrite: true },
        { id: '2', name: 'Hindi', canSpeak: true, canRead: true, canWrite: true }
    ],

    experience: [],
    certifications: [],

    resume: null,
    resumeName: "",
    resumeUrl: "",
    githubUrl: "",
    linkedinUrl: ""
};

// --- Helper Components ---

const SectionCard = ({
    title,
    icon: Icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    children
}: {
    title: string;
    icon?: any;
    isEditing: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            title="Cancel"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onSave}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                            title="Save"
                        >
                            <CheckCircle className="w-5 h-5" />
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

import { useNavigate } from 'react-router-dom';

export function UserProfile() {
    const navigate = useNavigate();
    const [data, setData] = useState<UserProfileData>(INITIAL_DATA);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        // Check if user is actually a user (not organization)
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.user_type === 'organization') {
                navigate('/organization-profile');
                return;
            }
            setData(prev => ({ ...prev, email: parsedUser.email, fullName: parsedUser.name || prev.fullName }));
        }

        // Fetch profile data
        const fetchProfile = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.USER_PROFILE,
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
                        // Merge fetched data with initial structure to avoid missing fields
                        setData(prev => ({ ...prev, ...result.profile }));
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
    const [tempData, setTempData] = useState<UserProfileData>(INITIAL_DATA);

    const saveToBackend = async (dataToSave: UserProfileData) => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.USER_PROFILE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSave)
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

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
            try {
                await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            } catch (error) { console.error("Logout error", error); }
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    const startEditing = (section: string) => {
        setTempData({ ...data }); // Clone current data to temp
        setEditingSection(section);
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setTempData(INITIAL_DATA); // Reset temp safety
    };

    const saveSection = async (section: string) => {
        let newData = { ...data, ...tempData };

        // Handle profile photo upload (similar to resume)
        if (section === 'basic' && tempData.profilePhoto instanceof File) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', tempData.profilePhoto);

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
                    newData.profilePhotoUrl = uploadData.url;
                    newData.profilePhoto = null; // Clear file object after upload
                } else {
                    console.error("Upload failed");
                    setMessage({ type: 'error', text: 'Failed to upload profile photo' });
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Upload error", err);
                setMessage({ type: 'error', text: 'Error uploading profile photo' });
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }

        // Handle resume upload
        if (section === 'resume' && tempData.resume instanceof File) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', tempData.resume);

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
                    newData.resumeUrl = uploadData.url;
                    newData.resumeName = uploadData.filename;
                    newData.resume = null; // Clear file object after upload
                } else {
                    console.error("Upload failed");
                    setMessage({ type: 'error', text: 'Failed to upload resume' });
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Upload error", err);
                setMessage({ type: 'error', text: 'Error uploading resume' });
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }

        // Filter out empty strings from skills array
        if (section === 'skills' && Array.isArray(newData.skills)) {
            newData.skills = newData.skills.filter(skill => skill && skill.trim() !== '');
        }

        // Create a clean copy for storage - remove File objects
        const finalData = { ...newData };
        if (finalData.resume instanceof File) {
            // @ts-ignore
            finalData.resume = null;
        } else if (section === 'resume') {
            // @ts-ignore
            finalData.resume = null;
        }
        if (finalData.profilePhoto instanceof File) {
            // @ts-ignore
            finalData.profilePhoto = null;
        } else if (section === 'basic') {
            // @ts-ignore
            finalData.profilePhoto = null;
        }

        setData(newData);
        await saveToBackend(finalData);
        setEditingSection(null);
    }; // End saveSection

    const handleGlobalSubmit = async () => {
        await saveToBackend(data);
    };

    // --- Handlers for Inputs ---
    const handleTempChange = (field: keyof UserProfileData, value: any) => {
        setTempData(prev => ({ ...prev, [field]: value }));
    };

    // --- Render Functions ---

    const renderBasicInfo = () => {
        const isEditing = editingSection === 'basic';

        if (isEditing) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden relative">
                            {tempData.profilePhotoUrl ? (
                                <img 
                                    src={tempData.profilePhotoUrl.startsWith('http') ? tempData.profilePhotoUrl : `${API_BASE_URL}${tempData.profilePhotoUrl}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <span className="text-2xl text-slate-400">📷</span>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Profile Photo</label>
                            <input
                                type="file"
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setTempData(prev => ({ ...prev, profilePhoto: file, profilePhotoUrl: url }));
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Full Name <span className="text-xs text-slate-400 font-normal">(Read Only)</span></label>
                        <input
                            type="text"
                            className="input-field bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={tempData.fullName}
                            readOnly
                            disabled
                        />
                    </div>
                    <div>
                        <label className="label">Gender</label>
                        <select
                            className="input-field"
                            value={tempData.gender}
                            onChange={e => handleTempChange('gender', e.target.value)}
                        >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Date of Birth</label>
                        <input
                            type="date" className="input-field"
                            value={tempData.dob}
                            onChange={e => handleTempChange('dob', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Location</label>
                        <input
                            type="text" className="input-field" placeholder="City, State, Country"
                            value={tempData.location}
                            onChange={e => handleTempChange('location', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Phone Number</label>
                        <input
                            type="tel" className="input-field"
                            value={tempData.phone}
                            onChange={e => handleTempChange('phone', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Email Address <span className="text-xs text-slate-400 font-normal">(Read Only)</span></label>
                        <input
                            type="email"
                            className="input-field bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={tempData.email}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-24 h-24 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                    {data.profilePhotoUrl ? (
                        <img 
                            src={data.profilePhotoUrl.startsWith('http') ? data.profilePhotoUrl : `${API_BASE_URL}${data.profilePhotoUrl}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Name</p>
                        <p className="font-medium">{data.fullName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Location</p>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <p className="font-medium">{data.location}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <p className="font-medium">{data.email}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <p className="font-medium">{data.phone}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Gender</p>
                        <p className="font-medium">{data.gender}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Date of Birth</p>
                        <p className="font-medium">{data.dob}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderSummary = () => {
        if (editingSection === 'summary') {
            return (
                <div>
                    <label className="label">Profile Summary</label>
                    <textarea
                        className="input-field min-h-[120px]"
                        value={tempData.summary}
                        onChange={e => handleTempChange('summary', e.target.value)}
                        placeholder="Write a short professional summary..."
                    />
                </div>
            );
        }
        return <p className="text-slate-700 leading-relaxed">{data.summary || "No summary added."}</p>;
    };

    const renderEducation = () => {
        // Helper to add/remove education in temp state
        const addEdu = () => {
            const newEdu: Education = {
                id: Date.now().toString(),
                institute: '', degree: '', specialization: '', startDate: '', endDate: '', gradeType: 'Percentage', gradeValue: ''
            };
            setTempData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
        };

        const updateEdu = (index: number, field: keyof Education, val: string) => {
            const newEdus = [...tempData.education];
            newEdus[index] = { ...newEdus[index], [field]: val };
            setTempData(prev => ({ ...prev, education: newEdus }));
        };

        const removeEdu = (index: number) => {
            const newEdus = [...tempData.education];
            newEdus.splice(index, 1);
            setTempData(prev => ({ ...prev, education: newEdus }));
        };

        if (editingSection === 'education') {
            return (
                <div className="space-y-6">
                    {tempData.education.map((edu, idx) => (
                        <div key={edu.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                            <button onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Institute / College</label>
                                    <input type="text" className="input-field" value={edu.institute} onChange={e => updateEdu(idx, 'institute', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Degree / Course</label>
                                    <input type="text" className="input-field" value={edu.degree} onChange={e => updateEdu(idx, 'degree', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Specialization / Stream</label>
                                    <input type="text" className="input-field" value={edu.specialization} onChange={e => updateEdu(idx, 'specialization', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Start Date</label>
                                    <input type="date" className="input-field" value={edu.startDate} onChange={e => updateEdu(idx, 'startDate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input type="date" className="input-field" value={edu.endDate} onChange={e => updateEdu(idx, 'endDate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Grade Type</label>
                                    <select className="input-field" value={edu.gradeType} onChange={e => updateEdu(idx, 'gradeType', e.target.value)}>
                                        <option>Percentage</option>
                                        <option>CGPA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Grade Value</label>
                                    <input type="text" className="input-field" value={edu.gradeValue} onChange={e => updateEdu(idx, 'gradeValue', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addEdu} className="text-blue-600 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded">
                        <Plus className="w-4 h-4" /> Add Education
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {data.education.map(edu => (
                    <div key={edu.id} className="flex gap-4 items-start">
                        <div className="mt-1"><GraduationCap className="w-5 h-5 text-slate-400" /></div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{edu.degree} {edu.specialization ? `in ${edu.specialization}` : ''}</h3>
                            <p className="text-slate-600">{edu.institute}</p>
                            <p className="text-sm text-slate-500">{edu.startDate} - {edu.endDate} | {edu.gradeType}: {edu.gradeValue}</p>
                        </div>
                    </div>
                ))}
                {data.education.length === 0 && <p className="text-slate-500 italic">No education details added.</p>}
            </div>
        );
    };

    const renderSkills = () => {
        const predefinedSkills = ['React', 'Angular', 'Vue', 'Python', 'Java', 'SQL', 'MongoDB', 'Node.js', 'Machine Learning', 'AWS'];

        if (editingSection === 'skills') {
            return (
                <div onKeyDown={(e) => {
                    // Allow saving the section by pressing Enter (e.g. after selecting from dropdown)
                    // But ignore if it's the custom input dealing with a new value
                    if (e.key === 'Enter') {
                        saveSection('skills');
                    }
                }}>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tempData.skills.map(skill => (
                            <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                {skill}
                                <button onClick={() => {
                                    setTempData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
                                }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className="label">Add Skills</label>
                        <select
                            className="input-field mb-2"
                            value=""
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSection('skills');
                            }}
                            onChange={e => {
                                const selectedValue = e.target.value.trim();
                                if (selectedValue && !tempData.skills.includes(selectedValue)) {
                                    setTempData(prev => ({ ...prev, skills: [...prev.skills, selectedValue] }));
                                }
                                // Reset dropdown to empty value
                                e.target.value = "";
                            }}
                        >
                            <option value="">Select a skill...</option>
                            {predefinedSkills.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <input
                                id="custom-skill"
                                type="text"
                                className="input-field"
                                placeholder="Or type custom skill, press Enter to add"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const target = e.currentTarget;
                                        const value = target.value.trim();
                                        // If there's a value, we add it and STOP propagation so we don't save yet
                                        if (value) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!tempData.skills.includes(value)) {
                                                setTempData(prev => ({ ...prev, skills: [...prev.skills, value] }));
                                                target.value = "";
                                            }
                                        }
                                        // If empty, let it bubble up to the parent div to trigger save
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('custom-skill') as HTMLInputElement;
                                    if (input.value && !tempData.skills.includes(input.value)) {
                                        setTempData(prev => ({ ...prev, skills: [...prev.skills, input.value] }));
                                        input.value = "";
                                    }
                                }}
                                className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-wrap gap-2">
                {data.skills.map(skill => (
                    <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                    </span>
                ))}
                {data.skills.length === 0 && <p className="text-slate-500 italic">No skills added.</p>}
            </div>
        );
    };

    const renderExperience = () => {
        // Similar to education, simplified for length
        const addExp = () => {
            setTempData(prev => ({
                ...prev,
                experience: [...prev.experience, {
                    id: Date.now().toString(),
                    company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: ''
                }]
            }));
        };

        if (editingSection === 'experience') {
            return (
                <div className="space-y-6">
                    {tempData.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => {
                                const newExp = [...tempData.experience];
                                newExp.splice(idx, 1);
                                setTempData(prev => ({ ...prev, experience: newExp }));
                            }} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4" /></button>

                            <div><label className="label">Company Name</label><input className="input-field" value={exp.company} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].company = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                            <div><label className="label">Role / Position</label><input className="input-field" value={exp.role} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].role = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                            <div><label className="label">Location</label><input className="input-field" value={exp.location} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].location = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                            <div><label className="label">Start Date</label><input type="month" className="input-field" value={exp.startDate} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].startDate = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                            <div><label className="label">End Date</label><input type="month" className="input-field" value={exp.endDate} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].endDate = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                            <div className="col-span-full"><label className="label">Description</label><textarea className="input-field" value={exp.description} onChange={e => {
                                const newExp = [...tempData.experience]; newExp[idx].description = e.target.value; setTempData({ ...tempData, experience: newExp });
                            }} /></div>
                        </div>
                    ))}
                    <button onClick={addExp} className="text-blue-600 font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Experience</button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {data.experience.map(exp => (
                    <div key={exp.id} className="flex gap-4">
                        <div className="mt-1"><Briefcase className="w-5 h-5 text-slate-400" /></div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{exp.role}</h3>
                            <p className="font-medium text-slate-700">{exp.company}</p>
                            <p className="text-sm text-slate-500 mb-2">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate} | {exp.location}</p>
                            <p className="text-sm text-slate-600">{exp.description}</p>
                        </div>
                    </div>
                ))}
                {data.experience.length === 0 && <p className="text-slate-500 italic">No experience added.</p>}
            </div>
        );
    };

    const renderCertifications = () => {
        // Simplified certification renderer
        if (editingSection === 'certifications') {
            const addCert = () => setTempData(prev => ({
                ...prev, certifications: [...prev.certifications, {
                    id: Date.now().toString(), name: '', organization: '', url: '', expiryDate: '', doesNotExpire: false
                }]
            }));

            return (
                <div className="space-y-4">
                    {tempData.certifications.map((cert, idx) => (
                        <div key={cert.id} className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 relative">
                            <button onClick={() => {
                                const newCerts = [...tempData.certifications]; newCerts.splice(idx, 1); setTempData({ ...tempData, certifications: newCerts });
                            }} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                            <input className="input-field" placeholder="Certificate Name" value={cert.name} onChange={e => {
                                const nc = [...tempData.certifications]; nc[idx].name = e.target.value; setTempData({ ...tempData, certifications: nc });
                            }} />
                            <input className="input-field" placeholder="Organization" value={cert.organization} onChange={e => {
                                const nc = [...tempData.certifications]; nc[idx].organization = e.target.value; setTempData({ ...tempData, certifications: nc });
                            }} />
                        </div>
                    ))}
                    <button onClick={addCert} className="text-blue-600 font-medium flex gap-2"><Plus className="w-4 h-4" /> Add Certification</button>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {data.certifications.map(cert => (
                    <div key={cert.id} className="flex gap-3 items-center">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-sm text-slate-500">{cert.organization}</p>
                        </div>
                    </div>
                ))}
                {data.certifications.length === 0 && <p className="text-slate-500 italic">No certifications added.</p>}
            </div>
        );
    };

    const renderResume = () => {
        const isEditing = editingSection === 'resume';
        if (isEditing) {
            return (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <input type="file" className="hidden" id="resume-upload" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setTempData(prev => ({ ...prev, resume: file, resumeName: file.name }));
                    }} />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Click to upload resume (PDF/DOC)</p>
                        {tempData.resumeName && <p className="mt-2 text-blue-600 font-medium">{tempData.resumeName}</p>}
                    </label>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-8 h-8 text-red-500" />
                <div>
                    <p className="font-medium text-slate-800">{data.resumeName || "No Resume Uploaded"}</p>
                    {data.resumeUrl && (
                        <a
                            href={`${API_BASE_URL}${data.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 font-medium hover:underline"
                        >
                            Download
                        </a>
                    )}
                </div>
            </div>
        );
    };

    const renderLinks = () => {
        if (editingSection === 'links') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="label">GitHub URL</label>
                        <input className="input-field" value={tempData.githubUrl} onChange={e => handleTempChange('githubUrl', e.target.value)} />
                    </div>
                    <div>
                        <label className="label">LinkedIn URL</label>
                        <input className="input-field" value={tempData.linkedinUrl} onChange={e => handleTempChange('linkedinUrl', e.target.value)} />
                    </div>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {data.githubUrl && (
                    <a href={data.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Github className="w-4 h-4 text-slate-800" /> {data.githubUrl}
                    </a>
                )}
                {data.linkedinUrl && (
                    <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Linkedin className="w-4 h-4 text-blue-700" /> {data.linkedinUrl}
                    </a>
                )}
                {!data.githubUrl && !data.linkedinUrl && <p className="text-slate-500 italic">No links added.</p>}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-900">Candidate Profile</h1>
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
                            {loading ? 'Saving...' : 'Save Profile'}
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
                    title="Basic Information"
                    icon={null}
                    isEditing={editingSection === 'basic'}
                    onEdit={() => startEditing('basic')}
                    onSave={() => saveSection('basic')}
                    onCancel={cancelEditing}
                >
                    {renderBasicInfo()}
                </SectionCard>

                <SectionCard
                    title="Profile Summary"
                    icon={FileText}
                    isEditing={editingSection === 'summary'}
                    onEdit={() => startEditing('summary')}
                    onSave={() => saveSection('summary')}
                    onCancel={cancelEditing}
                >
                    {renderSummary()}
                </SectionCard>

                <SectionCard
                    title="Key Skills"
                    icon={Award}
                    isEditing={editingSection === 'skills'}
                    onEdit={() => startEditing('skills')}
                    onSave={() => saveSection('skills')}
                    onCancel={cancelEditing}
                >
                    {renderSkills()}
                </SectionCard>

                <SectionCard
                    title="Education"
                    icon={GraduationCap}
                    isEditing={editingSection === 'education'}
                    onEdit={() => startEditing('education')}
                    onSave={() => saveSection('education')}
                    onCancel={cancelEditing}
                >
                    {renderEducation()}
                </SectionCard>

                <SectionCard
                    title="Experience"
                    icon={Briefcase}
                    isEditing={editingSection === 'experience'}
                    onEdit={() => startEditing('experience')}
                    onSave={() => saveSection('experience')}
                    onCancel={cancelEditing}
                >
                    {renderExperience()}
                </SectionCard>

                <SectionCard
                    title="Certifications"
                    icon={Award}
                    isEditing={editingSection === 'certifications'}
                    onEdit={() => startEditing('certifications')}
                    onSave={() => saveSection('certifications')}
                    onCancel={cancelEditing}
                >
                    {renderCertifications()}
                </SectionCard>

                <SectionCard
                    title="Resume"
                    icon={FileText}
                    isEditing={editingSection === 'resume'}
                    onEdit={() => startEditing('resume')}
                    onSave={() => saveSection('resume')}
                    onCancel={cancelEditing}
                >
                    {renderResume()}
                </SectionCard>

                <SectionCard
                    title="Important Links"
                    icon={Globe}
                    isEditing={editingSection === 'links'}
                    onEdit={() => startEditing('links')}
                    onSave={() => saveSection('links')}
                    onCancel={cancelEditing}
                >
                    {renderLinks()}
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
            background-color: #FFFFFF;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
        </div>
    );
}
