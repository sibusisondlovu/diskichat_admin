import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaStar, FaRegStar, FaSatelliteDish, FaSync, FaEye } from "react-icons/fa";

// API Base URL removed as we now use direct Firestore/API-Football integration

export default function Matches() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchingMatch, setFetchingMatch] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        homeTeam: "",
        homeTeamId: null,
        awayTeam: "",
        awayTeamId: null,
        homeLogo: "", // Added
        awayLogo: "", // Added
        homeScore: 0,
        awayScore: 0,
        status: "upcoming", // upcoming, live, finished
        date: "",
        time: "",
        venue: "",
        isMatchOfTheDay: false,
        competitionId: "",
        apiMatchId: null, // Critical for App
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMatches();
        fetchCompetitions();
    }, []);

    const fetchMatches = async () => {
        try {
            const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const matchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMatches(matchesData);
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompetitions = async () => {
        // Hardcoded competitions since we removed the backend
        // We can create a config file for this later
        const defaultCompetitions = [
            { id: 288, name: "Premier Soccer League", country_name: "South Africa" },
            { id: 39, name: "Premier League", country_name: "England" },
            { id: 140, name: "La Liga", country_name: "Spain" },
            { id: 135, name: "Serie A", country_name: "Italy" },
            { id: 78, name: "Bundesliga", country_name: "Germany" },
            { id: 61, name: "Ligue 1", country_name: "France" },
            { id: 2, name: "UEFA Champions League", country_name: "World" },
            { id: 3, name: "UEFA Europa League", country_name: "World" },
            { id: 6, name: "Africa Cup of Nations", country_name: "World" },
        ];
        setCompetitions(defaultCompetitions);
    };

    const fetchNextMatch = async () => {
        if (!selectedLeagueId) {
            alert("Please select a competition first.");
            return;
        }

        setFetchingMatch(true);
        try {
            // Direct call to API-Football
            const response = await fetch(`https://v3.football.api-sports.io/fixtures?league=${selectedLeagueId}&next=1`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": "cd675cb5b4ff3bf1e26f67a7e1b68f76",
                    "x-rapidapi-host": "v3.football.api-sports.io"
                },
            });

            if (response.ok) {
                const data = await response.json();

                if (data.response && data.response.length > 0) {
                    const match = data.response[0].fixture;
                    const home = data.response[0].teams.home;
                    const away = data.response[0].teams.away;
                    const league = data.response[0].league;

                    // Helper to map API status
                    const mapApiStatus = (shortStatus) => {
                        if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(shortStatus)) return 'live';
                        if (['FT', 'AET', 'PEN'].includes(shortStatus)) return 'finished';
                        return 'upcoming';
                    };

                    const status = mapApiStatus(match.status.short);

                    // Pre-fill modal with fetched match data
                    const matchDate = new Date(match.date);
                    setFormData({
                        homeTeam: home.name,
                        homeTeamId: home.id,
                        awayTeam: away.name,
                        awayTeamId: away.id,
                        homeLogo: home.logo, // Store logo
                        awayLogo: away.logo, // Store logo
                        homeScore: match.goals.home || 0, // Fetch actual score
                        awayScore: match.goals.away || 0, // Fetch actual score
                        status: status,
                        date: matchDate.toISOString().split('T')[0],
                        time: matchDate.toTimeString().split(' ')[0].substring(0, 5),
                        venue: match.venue.name || "",
                        isMatchOfTheDay: false,
                        competitionId: league.id || selectedLeagueId,
                        apiMatchId: match.id, // Store API Match ID for App linking
                    });

                    setShowModal(true);
                } else {
                    alert("No upcoming matches found for this competition.");
                }
            } else {
                const error = await response.text();
                alert(`Error: ${error || "Failed to fetch match from API-Football"}`);
            }
        } catch (error) {
            console.error("Error fetching next match:", error);
            alert("Failed to connect to API-Football.");
        } finally {
            setFetchingMatch(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create Firestore Timestamp from date and time strings
            const dateTimeString = `${formData.date}T${formData.time}:00`;
            const matchDate = new Date(dateTimeString);
            const timestamp = Timestamp.fromDate(matchDate);

            const matchData = {
                ...formData,
                matchDate: timestamp, // Critical for App sorting/filtering
                updatedAt: serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(doc(db, "matches", editingId), matchData);
            } else {
                await addDoc(collection(db, "matches"), {
                    ...matchData,
                    createdAt: serverTimestamp(),
                });
            }


            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchMatches();
        } catch (error) {
            console.error("Error saving match:", error);
            alert("Error saving match. Check console.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this match?")) {
            try {
                await deleteDoc(doc(db, "matches", id));
                fetchMatches();
            } catch (error) {
                console.error("Error deleting match:", error);
            }
        }
    };

    const handleEdit = (match) => {
        setFormData({
            homeTeam: match.homeTeam,
            homeTeamId: match.homeTeamId || null,
            awayTeam: match.awayTeam,
            awayTeamId: match.awayTeamId || null,
            homeLogo: match.homeLogo || "",
            awayLogo: match.awayLogo || "",
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
            date: match.date,
            time: match.time,
            venue: match.venue,
            isMatchOfTheDay: match.isMatchOfTheDay || false,
            competitionId: match.competitionId || "",
            apiMatchId: match.apiMatchId || null,
        });
        setEditingId(match.id);
        setShowModal(true);
    };

    const toggleMatchOfTheDay = async (match) => {
        try {
            await updateDoc(doc(db, "matches", match.id), {
                isMatchOfTheDay: !match.isMatchOfTheDay
            });
            fetchMatches();
        } catch (error) {
            console.error("Error toggling MOTD:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            homeTeam: "",
            homeTeamId: null,
            awayTeam: "",
            awayTeamId: null,
            homeLogo: "",
            awayLogo: "",
            homeScore: 0,
            awayScore: 0,
            status: "upcoming",
            date: "",
            time: "",
            venue: "",
            isMatchOfTheDay: false,
            competitionId: "",
            apiMatchId: null,
        });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Match Management</h2>
                    <p className="text-slate-400 mt-1">Schedule and manage live games</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex gap-2 w-full">
                        <select
                            value={selectedLeagueId}
                            onChange={(e) => setSelectedLeagueId(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        >
                            <option value="">Select Competition</option>
                            {competitions.map(comp => (
                                <option key={comp.id} value={comp.id}>{comp.name} ({comp.country_name})</option>
                            ))}
                        </select>
                        <button
                            onClick={fetchNextMatch}
                            disabled={fetchingMatch || !selectedLeagueId}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            {fetchingMatch ? <FaSync className="animate-spin" /> : <FaSatelliteDish />}
                            <span className="hidden sm:inline">Sync Latest Match</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Loading matches...</div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-5">Match Details</th>
                                <th className="p-5">Schedule</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-center">Featured</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {matches.map((match) => (
                                <tr key={match.id} className="hover:bg-slate-700/30 transition duration-150">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-lg text-white">
                                                {match.homeTeam} <span className="text-slate-500 text-sm font-normal mx-2">vs</span> {match.awayTeam}
                                            </div>
                                        </div>
                                        {(match.homeScore > 0 || match.awayScore > 0) && (
                                            <div className="mt-1 inline-block px-2 py-0.5 bg-slate-900 rounded text-sm font-mono text-blue-400">
                                                {match.homeScore} - {match.awayScore}
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-500 mt-1">{match.venue}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-slate-200 font-medium">{match.date}</div>
                                        <div className="text-sm text-slate-500">{match.time}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${match.status === 'Live' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            match.status === 'Finished' ? 'bg-slate-700/50 text-slate-400 border-slate-600' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {match.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-center">
                                        <button
                                            onClick={() => toggleMatchOfTheDay(match)}
                                            className={`p-2 rounded-full transition-all ${match.isMatchOfTheDay ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/50' : 'text-slate-600 hover:text-slate-400'}`}
                                        >
                                            {match.isMatchOfTheDay ? (
                                                <FaStar className="text-lg drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                            ) : (
                                                <FaRegStar className="text-lg" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <button onClick={() => navigate(`/match/${match.id}`)} className="text-slate-400 hover:text-blue-400 p-2 transition" title="View Details"><FaEye /></button>
                                        <button onClick={() => handleEdit(match)} className="text-slate-400 hover:text-blue-400 p-2 transition"><FaEdit /></button>
                                        <button onClick={() => handleDelete(match.id)} className="text-slate-400 hover:text-red-400 p-2 transition"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                            {matches.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                                                <FaPlus size={24} />
                                            </div>
                                            <p className="text-lg font-medium text-slate-400">No matches scheduled</p>
                                            <p className="text-sm">Add a match to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Match' : 'Add New Match'}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Home Team</label>
                                    <input type="text" required className="match-input w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.homeTeam} onChange={e => setFormData({ ...formData, homeTeam: e.target.value })} placeholder="e.g. Chiefs" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Away Team</label>
                                    <input type="text" required className="match-input w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.awayTeam} onChange={e => setFormData({ ...formData, awayTeam: e.target.value })} placeholder="e.g. Pirates" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Date</label>
                                    <input type="date" required className="match-input w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Time</label>
                                    <input type="time" required className="match-input w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Venue</label>
                                <input type="text" className="match-input w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. FNB Stadium" />
                            </div>
                            <div className="grid grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status</label>
                                    <select className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="live">Live</option>
                                        <option value="finished">Finished</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Home Score</label>
                                    <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.homeScore} onChange={e => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Away Score</label>
                                    <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.awayScore} onChange={e => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium shadow-lg shadow-blue-900/20 transition">
                                    {editingId ? 'Update Match' : 'Create Match'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
