import React, { useState, useEffect } from 'react';
import {
    Users, Plus, X, Edit, Trash2, CheckCircle, AlertCircle,
    UserPlus, UserMinus, Save, LogOut, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

// --- Types ---

interface TeamMember {
    name: string;
    email: string;
    calendar_link: string;
}

interface Team {
    team_id: string;
    team_name: string;
    members: TeamMember[];
}

interface OrganizationData {
    company_name: string;
    organization_email: string;
    teams: Team[];
}

// --- Helper Components ---

const TeamCard = ({
    team,
    onEdit,
    onDelete
}: {
    team: Team;
    onEdit: (team: Team) => void;
    onDelete: (teamId: string) => void;
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-800">{team.team_name}</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(team)}
                        className="p-2 text-black hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit team"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(team.team_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete team"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {team.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                            <p className="font-medium text-slate-800">{member.name}</p>
                            <p className="text-sm text-slate-600">{member.email}</p>
                        </div>
                        <a
                            href={member.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Calendar
                        </a>
                    </div>
                ))}
                {team.members.length === 0 && (
                    <p className="text-slate-500 italic text-center py-4">No members added yet</p>
                )}
            </div>
        </div>
    );
};

const TeamFormModal = ({
    isOpen,
    onClose,
    onSave,
    editingTeam,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (team: Team) => void;
    editingTeam?: Team | null;
    loading: boolean;
}) => {
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        if (editingTeam) {
            setTeamName(editingTeam.team_name);
            setMembers([...editingTeam.members]);
        } else {
            setTeamName('');
            setMembers([]);
        }
    }, [editingTeam, isOpen]);

    const addMember = () => {
        setMembers([...members, { name: '', email: '', calendar_link: '' }]);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        const updatedMembers = [...members];
        updatedMembers[index][field] = value;
        setMembers(updatedMembers);
    };

    const handleSave = () => {
        if (!teamName.trim()) {
            alert('Team name is required');
            return;
        }

        // Filter out empty members
        const validMembers = members.filter(member =>
            member.name.trim() || member.email.trim() || member.calendar_link.trim()
        );

        const team: Team = {
            team_id: editingTeam?.team_id || `team_${Date.now()}`,
            team_name: teamName.trim(),
            members: validMembers
        };

        onSave(team);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {editingTeam ? 'Edit Team' : 'Create New Team'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Team Name *
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter team name"
                        />
                    </div>

                    {/* Team Members */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Team Members
                            </label>
                            <button
                                onClick={addMember}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Member
                            </button>
                        </div>

                        <div className="space-y-4">
                            {members.map((member, index) => (
                                <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                                    <button
                                        onClick={() => removeMember(index)}
                                        className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Remove member"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={member.name}
                                                onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Employee name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={member.email}
                                                onChange={(e) => updateMember(index, 'email', e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="employee@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                Calendar Link
                                            </label>
                                            <input
                                                type="url"
                                                value={member.calendar_link}
                                                onChange={(e) => updateMember(index, 'calendar_link', e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="https://calendar.google.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {members.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No team members added yet</p>
                                    <p className="text-sm">Click "Add Member" to get started</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Fill in the team name and add team members</li>
                            <li>• Each member needs a name, email, and calendar link</li>
                            <li>• You can add or remove members as needed</li>
                            <li>• All changes will be saved to your organization data</li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-black hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {editingTeam ? 'Update Team' : 'Create Team'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function OrganizationTeam() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [userData, setUserData] = useState<any>(null);

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

        // Fetch teams data
        fetchTeams();
    }, [navigate]);

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
                setMessage(null); // Clear any error messages on successful fetch
            } else if (res.status === 401) {
                clearAuthAndRedirect(navigate);
            } else {
                setMessage({ type: 'error', text: 'Failed to load teams data' });
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
            setMessage({ type: 'error', text: 'Error loading teams data' });
        } finally {
            setLoading(false);
        }
    };

    const saveTeamsToBackend = async (updatedTeams: Team[]) => {
        setLoading(true);
        setMessage(null);

        try {
            const organizationData: OrganizationData = {
                company_name: userData?.name || '',
                organization_email: userData?.email || '',
                teams: updatedTeams
            };

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_TEAMS,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(organizationData)
                },
                navigate
            );

            if (!res) return false;

            if (res.ok) {
                setMessage({ type: 'success', text: 'Teams updated successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: 'Failed to save teams data' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving teams data' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = () => {
        setEditingTeam(null);
        setModalOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setModalOpen(true);
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        const updatedTeams = teams.filter(team => team.team_id !== teamId);
        const success = await saveTeamsToBackend(updatedTeams);

        if (success) {
            setTeams(updatedTeams);
        }
    };

    const handleSaveTeam = async (team: Team) => {
        let updatedTeams: Team[];

        if (editingTeam) {
            // Update existing team
            updatedTeams = teams.map(t => t.team_id === team.team_id ? team : t);
        } else {
            // Add new team
            updatedTeams = [...teams, team];
        }

        const success = await saveTeamsToBackend(updatedTeams);

        if (success) {
            setTeams(updatedTeams);
            setModalOpen(false);
            setEditingTeam(null);
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

    if (loading && teams.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading teams...</p>
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
                        <h1 className="text-xl font-bold text-slate-900">Organization Teams</h1>
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
                            onClick={handleCreateTeam}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Team
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
                {teams.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No teams created yet</h3>
                        <p className="text-slate-500 mb-6">Create your first team to get started with team management</p>
                        <button
                            onClick={handleCreateTeam}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Team
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => (
                            <TeamCard
                                key={team.team_id}
                                team={team}
                                onEdit={handleEditTeam}
                                onDelete={handleDeleteTeam}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Team Form Modal */}
            <TeamFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTeam}
                editingTeam={editingTeam}
                loading={loading}
            />
        </div>
    );
}
