import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../firebase";
import { FaSearch, FaUser, FaTrophy, FaStar } from "react-icons/fa";

export default function Users() {
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
            // In a real app with thousands of users, use server-side pagination and Algolia for search
            // For now, we fetch a limited batch
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100));
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
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
                                <th className="p-5">Rank</th>
                                <th className="p-5">Joined</th>
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.rank === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                user.rank === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-slate-700/50 text-slate-400 border-slate-600'
                                            }`}>
                                            {user.rank || 'Amateur'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-slate-500 text-sm">
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
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
