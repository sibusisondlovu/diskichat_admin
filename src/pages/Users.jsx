import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaSearch, FaUser, FaStar, FaEye, FaBan, FaUserSlash, FaCheck } from "react-icons/fa";

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredUsers(users);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(user =>
                (user.username && user.username.toLowerCase().includes(lowerSearch)) ||
                (user.displayName && user.displayName.toLowerCase().includes(lowerSearch)) ||
                (user.email && user.email.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            // Fetch users without orderBy to ensure we get ALL users, including legacy ones without createdAt
            // In a real app with thousands of users, we would backfill the data, but here client-side sort is fine for <100 users
            const q = query(collection(db, "users"), limit(100));
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side sort: Highest points first
            usersData.sort((a, b) => {
                const pointsA = a.points || 0;
                const pointsB = b.points || 0;
                return pointsB - pointsA;
            });

            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, "users", userId), {
                status: newStatus
            });

            // Optimistic update
            const updatedUsers = users.map(u =>
                u.id === userId ? { ...u, status: newStatus } : u
            );
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers); // Re-filter if needed, or just update state

        } catch (error) {
            console.error("Error updating user status:", error);
            alert("Failed to update status");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Base</h2>
                    <p className="text-slate-400 mt-1">Monitor registered users and activity</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none w-72 shadow-lg placeholder-slate-500 transition"
                    />
                    <FaSearch className="absolute left-3 top-3.5 text-slate-500" />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Loading users...</div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-5">User Profile</th>
                                <th className="p-5">Team Loyalty</th>
                                <th className="p-5">Gamification</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/30 transition duration-150">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FaUser className="text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{user.displayName || user.username || "Unknown"}</div>
                                                <div className="text-xs text-slate-400">{user.email || user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-slate-300">
                                        {user.favoriteTeam ? (
                                            <div className="flex items-center gap-2">
                                                {user.favoriteTeamLogo && <img src={user.favoriteTeamLogo} alt="Team" className="w-6 h-6 object-contain" />}
                                                <span>{user.favoriteTeam}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 italic">No team selected</span>
                                        )}
                                    </td>
                                    <td className="p-5 font-bold text-white">
                                        <div className="flex items-center gap-1.5">
                                            <FaStar className="text-yellow-500" size={14} />
                                            {user.points || 0} <span className="text-xs font-normal text-slate-500">pts</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            user.status === 'suspended' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-green-500/10 text-green-400 border-green-500/20'
                                            }`}>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <button
                                            onClick={() => navigate(`/user/${user.id}`)}
                                            className="text-slate-400 hover:text-blue-400 p-2 transition"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>

                                        {user.status !== 'suspended' && user.status !== 'banned' && (
                                            <button
                                                onClick={() => handleStatusUpdate(user.id, 'suspended')}
                                                className="text-slate-400 hover:text-orange-400 p-2 transition"
                                                title="Suspend User"
                                            >
                                                <FaUserSlash />
                                            </button>
                                        )}

                                        {user.status !== 'banned' ? (
                                            <button
                                                onClick={() => handleStatusUpdate(user.id, 'banned')}
                                                className="text-slate-400 hover:text-red-400 p-2 transition"
                                                title="Ban User"
                                            >
                                                <FaBan />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate(user.id, 'active')}
                                                className="text-slate-400 hover:text-green-400 p-2 transition"
                                                title="Activate User"
                                            >
                                                <FaCheck />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">No users found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
