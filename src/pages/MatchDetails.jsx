import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft, FaFutbol, FaUsers, FaListOl, FaClock, FaMapMarkerAlt, FaTrophy } from "react-icons/fa";

export default function MatchDetails() {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("events"); // events, lineups, banter
    const [activeUsers, setActiveUsers] = useState([]);
    const [apiData, setApiData] = useState(null);
    const [loadingApi, setLoadingApi] = useState(false);

    useEffect(() => {
        fetchMatchDetails();
    }, [id]);

    useEffect(() => {
        if (match?.apiMatchId && (activeTab === 'events' || activeTab === 'lineups')) {
            fetchApiData(match.apiMatchId);
        }
    }, [match, activeTab]);

    useEffect(() => {
        if (activeTab === 'banter') {
            const unsubscribe = subscribeToActiveUsers();
            return () => unsubscribe();
        }
    }, [id, activeTab]);

    const fetchMatchDetails = async () => {
        try {
            const docRef = doc(db, "matches", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMatch({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("No such match!");
            }
        } catch (error) {
            console.error("Error fetching match:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApiData = async (apiId) => {
        if (apiData || loadingApi) return;
        setLoadingApi(true);
        try {
            const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${apiId}`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": "cd675cb5b4ff3bf1e26f67a7e1b68f76",
                    "x-rapidapi-host": "v3.football.api-sports.io"
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.response && data.response.length > 0) {
                    setApiData(data.response[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching API data:", error);
        } finally {
            setLoadingApi(false);
        }
    };

    const subscribeToActiveUsers = () => {
        const q = query(collection(db, "banter_rooms", id, "activeUsers"), orderBy("lastActive", "desc"), limit(50));
        return onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActiveUsers(users);
        });
    };

    if (loading) return <div className="text-center py-20 text-white">Loading match details...</div>;
    if (!match) return <div className="text-center py-20 text-white">Match not found.</div>;

    const fixture = apiData?.fixture;
    const goals = apiData?.goals;
    const events = apiData?.events || [];
    const lineups = apiData?.lineups || [];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Match Center</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <FaTrophy className="text-blue-500" />
                        <span>{match.competitionName || "Competition"}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <FaMapMarkerAlt />
                        <span>{match.venue || "Venue TBD"}</span>
                    </div>
                </div>
            </div>

            {/* Scoreboard Card */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${match.status === 'live' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                        {match.status.toUpperCase()}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-4">
                    {/* Home Team */}
                    <div className="flex flex-col items-center text-center flex-1">
                        <div className="w-24 h-24 bg-white/5 rounded-full p-4 mb-4 border border-white/10 shadow-lg">
                            {match.homeLogo ? <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain" /> : <FaFutbol className="w-full h-full text-slate-600" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{match.homeTeam}</h2>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center mx-8">
                        <div className="text-5xl font-black text-white tracking-tighter tabular-nums flex items-center gap-4">
                            <span>{match.homeScore}</span>
                            <span className="text-slate-600 text-3xl">-</span>
                            <span>{match.awayScore}</span>
                        </div>
                        {fixture?.status?.elapsed && (
                            <div className="mt-2 text-blue-400 font-mono font-bold flex items-center gap-2">
                                <FaClock /> {fixture.status.elapsed}'
                            </div>
                        )}
                        <div className="text-slate-500 text-sm mt-2">{match.date} • {match.time}</div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center text-center flex-1">
                        <div className="w-24 h-24 bg-white/5 rounded-full p-4 mb-4 border border-white/10 shadow-lg">
                            {match.awayLogo ? <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain" /> : <FaFutbol className="w-full h-full text-slate-600" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{match.awayTeam}</h2>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex border-b border-slate-800">
                    {[
                        { id: 'events', label: 'Match Events', icon: <FaFutbol /> },
                        { id: 'lineups', label: 'Lineups', icon: <FaListOl /> },
                        { id: 'banter', label: 'Banter Room', icon: <FaUsers /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium text-sm transition-all ${activeTab === tab.id
                                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[400px]">
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            {loadingApi ? (
                                <div className="text-center text-slate-500 py-10">Loading events...</div>
                            ) : events.length > 0 ? (
                                <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
                                    {events.map((event, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-blue-400 font-mono font-bold">{event.time.elapsed}'</span>
                                                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider border border-slate-700 px-1.5 rounded">{event.type}</span>
                                            </div>
                                            <div className="text-white font-medium">
                                                {event.player.name} <span className="text-slate-500">({event.team.name})</span>
                                            </div>
                                            {event.assist.name && <div className="text-sm text-slate-500">Assist: {event.assist.name}</div>}
                                            <div className="text-sm text-slate-400 mt-1">{event.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10">
                                    <p>No events available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'lineups' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {loadingApi ? (
                                <div className="col-span-2 text-center text-slate-500 py-10">Loading lineups...</div>
                            ) : lineups.length > 0 ? (
                                lineups.map((teamLineup, idx) => (
                                    <div key={idx} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                                            <img src={teamLineup.team.logo} className="w-8 h-8 object-contain" alt="" />
                                            <h3 className="font-bold text-white">{teamLineup.team.name}</h3>
                                            <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{teamLineup.formation}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-xs font-semibold text-slate-500 uppercase">Starting XI</div>
                                            {teamLineup.startXI.map((player, pIdx) => (
                                                <div key={pIdx} className="flex items-center gap-3 text-sm">
                                                    <span className="w-6 text-slate-500 font-mono text-right">{player.player.number}</span>
                                                    <span className="text-slate-200">{player.player.name}</span>
                                                    <span className="text-xs text-slate-500 ml-auto">{player.player.pos}</span>
                                                </div>
                                            ))}
                                            <div className="text-xs font-semibold text-slate-500 uppercase mt-4 pt-2 border-t border-slate-700/30">Substitutes</div>
                                            {teamLineup.substitutes.map((player, pIdx) => (
                                                <div key={pIdx} className="flex items-center gap-3 text-sm">
                                                    <span className="w-6 text-slate-500 font-mono text-right">{player.player.number}</span>
                                                    <span className="text-slate-400">{player.player.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center text-slate-500 py-10">
                                    <p>Lineups not available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'banter' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {activeUsers.length} Users Online
                                </h3>
                            </div>

                            {activeUsers.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {activeUsers.map(user => (
                                        <div key={user.id} className="bg-slate-800 p-3 rounded-lg flex items-center gap-3 border border-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                <FaUsers size={14} />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-white truncate">{user.userId}</p>
                                                <p className="text-xs text-slate-500">
                                                    {user.lastActive?.seconds ? new Date(user.lastActive.seconds * 1000).toLocaleTimeString() : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                    <FaUsers className="mx-auto text-3xl mb-3 opacity-30" />
                                    <p>The banter room is currently empty.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
