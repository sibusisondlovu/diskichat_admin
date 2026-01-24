import { useState, useEffect } from "react";
import { collection, doc, setDoc, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaSatelliteDish, FaSync, FaCalendarAlt, FaClock, FaFutbol, FaCheck } from "react-icons/fa";

export default function Fixtures() {
    const [competitions, setCompetitions] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState("");
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importingInfo, setImportingInfo] = useState({}); // { [apiMatchId]: 'loading' | 'success' | 'error' }

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        // Hardcoded competitions (Same as Matches.jsx)
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

    const fetchFixtures = async () => {
        if (!selectedLeagueId) return;

        setLoading(true);
        setFixtures([]);
        try {
            // Fetch next 20 matches for the league
            const response = await fetch(`https://v3.football.api-sports.io/fixtures?league=${selectedLeagueId}&next=20`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
                    "x-rapidapi-host": import.meta.env.VITE_RAPIDAPI_HOST
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.response) {
                    setFixtures(data.response);
                }
            } else {
                console.error("API Error:", await response.text());
                alert("Failed to fetch fixtures from API.");
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Network error while fetching fixtures.");
        } finally {
            setLoading(false);
        }
    };

    const mapApiStatus = (shortStatus) => {
        if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(shortStatus)) return 'live';
        if (['FT', 'AET', 'PEN'].includes(shortStatus)) return 'finished';
        return 'upcoming';
    };

    const importMatch = async (fixtureData) => {
        const { fixture, teams, goals, league } = fixtureData;
        const apiMatchId = String(fixture.id); // Firestore Doc ID

        setImportingInfo(prev => ({ ...prev, [apiMatchId]: 'loading' }));

        try {
            // 1. Fetch Full Fixture Details (Lineups, Events, Stats)
            // The search endpoint might not have everything. Safer to fetch by ID.
            const detailsResponse = await fetch(`https://v3.football.api-sports.io/fixtures?id=${apiMatchId}`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
                    "x-rapidapi-host": import.meta.env.VITE_RAPIDAPI_HOST
                },
            });

            let fullFixtureData = fixtureData;
            let lineups = [];
            let events = [];

            if (detailsResponse.ok) {
                const details = await detailsResponse.json();
                if (details.response && details.response.length > 0) {
                    fullFixtureData = details.response[0];
                    lineups = fullFixtureData.lineups || [];
                    events = fullFixtureData.events || [];
                }
            }

            const status = mapApiStatus(fullFixtureData.fixture.status.short);
            const matchDate = new Date(fullFixtureData.fixture.date);

            const matchData = {
                homeTeam: fullFixtureData.teams.home.name,
                homeTeamId: fullFixtureData.teams.home.id,
                awayTeam: fullFixtureData.teams.away.name,
                awayTeamId: fullFixtureData.teams.away.id,
                homeLogo: fullFixtureData.teams.home.logo,
                awayLogo: fullFixtureData.teams.away.logo,
                homeScore: fullFixtureData.goals.home || 0,
                awayScore: fullFixtureData.goals.away || 0,
                status: status,
                date: matchDate.toISOString().split('T')[0],
                time: matchDate.toTimeString().split(' ')[0].substring(0, 5),
                venue: fullFixtureData.fixture.venue.name || "",
                competitionId: fullFixtureData.league.id,
                competitionName: fullFixtureData.league.name,
                apiMatchId: fullFixtureData.fixture.id,
                matchDate: Timestamp.fromDate(matchDate),
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                lineups: lineups, // Save lineups
                events: events,   // Save events
            };

            await setDoc(doc(db, "matches", apiMatchId), matchData, { merge: true });

            // Handle Live Matches collection
            if (status === 'live') {
                await setDoc(doc(db, "live_matches", apiMatchId), { ...matchData, id: apiMatchId }, { merge: true });
                await setDoc(doc(db, "banter_rooms", apiMatchId), { matchId: apiMatchId }, { merge: true });
            }

            setImportingInfo(prev => ({ ...prev, [apiMatchId]: 'success' }));

            setTimeout(() => {
                setImportingInfo(prev => {
                    const newState = { ...prev };
                    delete newState[apiMatchId];
                    return newState;
                });
            }, 3000);

        } catch (error) {
            console.error("Import Error:", error);
            setImportingInfo(prev => ({ ...prev, [apiMatchId]: 'error' }));
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Fixtures</h2>
                    <p className="text-slate-400 mt-1">Browse and import matches from API-Football</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={selectedLeagueId}
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    >
                        <option value="">Select Competition</option>
                        {competitions.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.name} ({comp.country_name})</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchFixtures}
                        disabled={loading || !selectedLeagueId}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <FaSync className="animate-spin" /> : <FaSatelliteDish />}
                        Fetch
                    </button>
                </div>
            </div>

            {loading && (
                <div className="text-center py-20 text-slate-500 animate-pulse">Loading fixtures...</div>
            )}

            {!loading && fixtures.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {fixtures.map((item) => {
                        const { fixture, teams } = item;
                        const apiMatchId = String(fixture.id);
                        const status = mapApiStatus(fixture.status.short);
                        const importStatus = importingInfo[apiMatchId];

                        return (
                            <div key={fixture.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-slate-600 transition">
                                {/* Match Info */}
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="flex flex-col items-center w-16 text-slate-400 text-sm">
                                        <span className="font-bold text-slate-200">{new Date(fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="text-xs">{new Date(fixture.date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <img src={teams.home.logo} alt={teams.home.name} className="w-6 h-6 object-contain" />
                                            <span className="text-white font-medium">{teams.home.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <img src={teams.away.logo} alt={teams.away.name} className="w-6 h-6 object-contain" />
                                            <span className="text-white font-medium">{teams.away.name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="min-w-[100px] text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status === 'live' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                                        status === 'finished' ? 'bg-slate-700/50 text-slate-400 border-slate-600' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {fixture.status.short}
                                    </span>
                                </div>

                                {/* Action */}
                                <div>
                                    {importStatus === 'success' ? (
                                        <button disabled className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg flex items-center gap-2">
                                            <FaCheck /> Imported
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => importMatch(item)}
                                            disabled={importStatus === 'loading'}
                                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${importStatus === 'loading'
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                        >
                                            {importStatus === 'loading' ? <FaSync className="animate-spin" /> : <FaSatelliteDish />}
                                            Import Match
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && fixtures.length === 0 && selectedLeagueId && (
                <div className="text-center py-20 text-slate-500">
                    No upcoming fixtures found for this competition.
                </div>
            )}
        </div>
    );
}
