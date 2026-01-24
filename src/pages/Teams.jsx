import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FaShieldAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const q = query(collection(db, "teams"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const teamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeams(teamsData);
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.venue_name && team.venue_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Teams</h2>
                    <p className="text-slate-400 mt-1">View all registered teams</p>
                </div>

                <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Loading teams...</div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-5">Team</th>
                                <th className="p-5">Venue</th>
                                <th className="p-5">Founded</th>
                                <th className="p-5 text-right">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredTeams.map((team) => (
                                <tr key={team.id} className="hover:bg-slate-700/30 transition duration-150">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            {team.logo ? (
                                                <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
                                                    <FaShieldAlt />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{team.name}</div>
                                                <div className="text-xs text-slate-500">{team.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <FaMapMarkerAlt className="text-slate-600" />
                                            {team.venue_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-500 ml-6">{team.venue_city}</div>
                                    </td>
                                    <td className="p-5 text-slate-400">
                                        {team.founded || '-'}
                                    </td>
                                    <td className="p-5 text-right font-mono text-xs text-slate-600">
                                        {team.id}
                                    </td>
                                </tr>
                            ))}
                            {filteredTeams.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-500">
                                        No teams found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
