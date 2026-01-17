import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft, FaUser, FaEnvelope, FaTrophy, FaStar, FaShieldAlt, FaBan, FaUserSlash, FaCheck, FaCalendarAlt } from "react-icons/fa";

export default function UserDetails() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            const docRef = doc(db, "users", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUser({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("No such user!");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, "users", id), { status: newStatus });
            setUser(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="text-center py-20 text-white animate-pulse">Loading user profile...</div>;
    if (!user) return <div className="text-center py-20 text-red-400">User not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/users" className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition">
                    <FaArrowLeft />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">User Profile</h1>
                    <div className="text-sm text-slate-400">Manage user account and view activity</div>
                </div>
                <div className="flex gap-2">
                    {user.status !== 'suspended' && user.status !== 'banned' && (
                        <button onClick={() => handleStatusUpdate('suspended')} className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition flex items-center gap-2">
                            <FaUserSlash /> Suspend
                        </button>
                    )}
                    {user.status !== 'banned' ? (
                        <button onClick={() => handleStatusUpdate('banned')} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition flex items-center gap-2">
                            <FaBan /> Ban
                        </button>
                    ) : (
                        <button onClick={() => handleStatusUpdate('active')} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition flex items-center gap-2">
                            <FaCheck /> Activate
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                        <div className="w-32 h-32 mx-auto rounded-full bg-slate-700 p-1 border-2 border-blue-500/50 overflow-hidden mb-4">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <FaUser className="w-full h-full text-slate-500 p-6" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white">{user.displayName || user.username || "Anonymous"}</h2>
                        <p className="text-slate-400 text-sm mb-4">@{user.username || "unknown"}</p>

                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${user.status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                user.status === 'suspended' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${user.status === 'banned' ? 'bg-red-500' :
                                    user.status === 'suspended' ? 'bg-orange-500' :
                                        'bg-green-500'
                                }`}></span>
                            {user.status || 'Active'}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mt-6 shadow-lg space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400"><FaEnvelope /></div>
                            <div className="flex-1 truncate">
                                <span className="block text-xs text-slate-500 uppercase">Email</span>
                                {user.email || "No email provided"}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-purple-400"><FaCalendarAlt /></div>
                            <div className="flex-1 truncate">
                                <span className="block text-xs text-slate-500 uppercase">Joined</span>
                                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                                <FaStar size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">{user.points || 0}</h3>
                                <p className="text-slate-500 text-sm">Total Points</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <FaTrophy size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white capitalize">{user.rank || 'Amateur'}</h3>
                                <p className="text-slate-500 text-sm">Current Rank</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 min-h-[200px]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FaShieldAlt className="text-slate-500" /> Account Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm text-slate-500 uppercase font-semibold mb-1">Favorite Team</h4>
                                {user.favoriteTeam ? (
                                    <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border border-slate-700/50 inline-block">
                                        {user.favoriteTeamLogo && <img src={user.favoriteTeamLogo} className="w-8 h-8 object-contain" alt={user.favoriteTeam} />}
                                        <span className="font-medium text-white">{user.favoriteTeam}</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic">No favorite team selected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
