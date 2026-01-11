
import { useState, useEffect } from "react";
import { FaSync, FaTrophy, FaPlaneDeparture } from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api"; // Ensure this matches your backend

export default function Competitions() {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [customIds, setCustomIds] = useState("");

    // Default IDs provided by requirements
    const DEFAULT_IDS = [288, 508, 507, 39, 140, 78, 135, 2, 12, 1, 6];

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/competitions`);
            if (response.ok) {
                const data = await response.json();
                setCompetitions(data);
            } else {
                console.error("Failed to fetch competitions");
            }
        } catch (error) {
            console.error("Error fetching competitions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (idsToSync) => {
        setSyncing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/competitions/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToSync }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Sync Successful! Processed ${result.count} competitions.`);
                fetchCompetitions(); // Refresh list
            } else {
                const errorData = await response.json();
                alert(`Sync Failed: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("An error occurred during sync.");
        } finally {
            setSyncing(false);
            setCustomIds("");
        }
    };

    const handleCustomSync = (e) => {
        e.preventDefault();
        const ids = customIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length > 0) {
            handleSync(ids);
        } else {
            alert("Please enter valid numeric IDs separated by commas.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Competitions</h2>
                    <p className="text-slate-400 mt-1">Manage supported leagues and tournaments</p>
                </div>

                <div className="flex gap-4">
                    <form onSubmit={handleCustomSync} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="IDs: 39, 140..."
                            value={customIds}
                            onChange={(e) => setCustomIds(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-40"
                        />
                        <button
                            type="submit"
                            disabled={syncing}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            Sync Custom
                        </button>
                    </form>

                    <button
                        onClick={() => handleSync(DEFAULT_IDS)}
                        disabled={syncing}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                        <FaSync className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing..." : "Sync Defaults"}
                    </button>
                </div>

            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Loading competitions...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map((comp) => (
                        <div key={comp.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center hover:bg-slate-800 transition group">
                            <div className="w-16 h-16 bg-white rounded-full p-2 mb-4 shadow-lg group-hover:scale-110 transition duration-300">
                                <img src={comp.logo} alt={comp.name} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{comp.name}</h3>
                            <div className="text-sm text-slate-400 flex items-center gap-2 mb-4">
                                {comp.country_flag && <img src={comp.country_flag} alt="flag" className="w-4 h-4 rounded-sm" />}
                                {comp.country_name}
                            </div>

                            <div className="w-full border-t border-slate-700 pt-4 mt-auto">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Type: <strong className="text-slate-300">{comp.type}</strong></span>
                                    <span>Season: <strong className="text-blue-400">{comp.season_year}</strong></span>
                                </div>
                                <div className="text-xs text-slate-600 mt-2">
                                    ID: {comp.id}
                                </div>
                            </div>
                        </div>
                    ))}

                    {competitions.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
                            <p>No competitions found. Click "Sync Defaults" to load them.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
