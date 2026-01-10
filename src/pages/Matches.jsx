import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaStar, FaRegStar } from "react-icons/fa";

export default function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        homeTeam: "",
        awayTeam: "",
        homeScore: 0,
        awayScore: 0,
        status: "Scheduled", // Scheduled, Live, Finished
        date: "",
        time: "",
        venue: "",
        isMatchOfTheDay: false,
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMatches();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "matches", editingId), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "matches"), {
                    ...formData,
                    createdAt: serverTimestamp(),
                });
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchMatches();
        } catch (error) {
            console.error("Error saving match:", error);
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
            awayTeam: match.awayTeam,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
            date: match.date,
            time: match.time,
            venue: match.venue,
            isMatchOfTheDay: match.isMatchOfTheDay || false,
        });
        setEditingId(match.id);
        setShowModal(true);
    };

    const toggleMatchOfTheDay = async (match) => {
        try {
            // Optional: Unset others if we only want one single MOTD
            // For now, toggle individually
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
            awayTeam: "",
            homeScore: 0,
            awayScore: 0,
            status: "Scheduled",
            date: "",
            time: "",
            venue: "",
            isMatchOfTheDay: false,
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Match Management</h2>
                <button
                    onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Add Match
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="p-4">Match</th>
                                <th className="p-4">Date/Time</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">MOTD</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {matches.map((match) => (
                                <tr key={match.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-900">
                                            {match.homeTeam} <span className="text-gray-400 mx-1">vs</span> {match.awayTeam}
                                        </div>
                                        {(match.homeScore > 0 || match.awayScore > 0) && (
                                            <div className="text-sm text-gray-500">{match.homeScore} - {match.awayScore}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div>{match.date}</div>
                                        <div className="text-xs text-gray-400">{match.time}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${match.status === 'Live' ? 'bg-green-100 text-green-700' :
                                                match.status === 'Finished' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {match.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => toggleMatchOfTheDay(match)} className="focus:outline-none">
                                            {match.isMatchOfTheDay ? (
                                                <FaStar className="text-yellow-400 text-lg" />
                                            ) : (
                                                <FaRegStar className="text-gray-300 text-lg hover:text-yellow-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(match)} className="text-blue-600 hover:text-blue-800 p-2"><FaEdit /></button>
                                        <button onClick={() => handleDelete(match.id)} className="text-red-600 hover:text-red-800 p-2"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                            {matches.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No matches found. Add one to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
                        <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Match' : 'Add New Match'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Home Team</label>
                                    <input type="text" required className="match-input w-full border p-2 rounded" value={formData.homeTeam} onChange={e => setFormData({ ...formData, homeTeam: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Away Team</label>
                                    <input type="text" required className="match-input w-full border p-2 rounded" value={formData.awayTeam} onChange={e => setFormData({ ...formData, awayTeam: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input type="date" required className="match-input w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time</label>
                                    <input type="time" required className="match-input w-full border p-2 rounded" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Venue</label>
                                <input type="text" className="match-input w-full border p-2 rounded" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select className="w-full border p-2 rounded" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Live">Live</option>
                                        <option value="Finished">Finished</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Home Score</label>
                                    <input type="number" className="w-full border p-2 rounded" value={formData.homeScore} onChange={e => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Away Score</label>
                                    <input type="number" className="w-full border p-2 rounded" value={formData.awayScore} onChange={e => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Match</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
