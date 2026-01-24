import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { FaChartBar, FaFingerprint, FaClipboardList, FaCommentAlt } from "react-icons/fa";

export default function Analytics() {
    const [stats, setStats] = useState({
        subscriptionClicks: 0,
        subscriptionAttempts: 0,
        lastUpdated: null
    });
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Fetch Subscription Clicks (from metrics/subscription_clicks)
            const clicksRef = doc(db, "metrics", "subscription_clicks");
            const clicksSnap = await getDoc(clicksRef);
            let clicksCount = 0;
            let lastUp = null;
            if (clicksSnap.exists()) {
                const data = clicksSnap.data();
                clicksCount = data.count || 0;
                lastUp = data.updatedAt ? data.updatedAt.toDate().toLocaleString() : null;
            }

            // 2. Fetch Subscription Attempts (count from collection 'subscription_attempts')
            // Using getDocs to count. For large collections, use aggregation query (count()), 
            // but standard getDocs is fine for admin panel if < 1000 docs.
            // User mentioned collection name: subscription_attempts
            const attemptsRef = collection(db, "subscription_attempts");
            const attemptsSnap = await getDocs(attemptsRef);
            const attemptsCount = attemptsSnap.size;

            setStats({
                subscriptionClicks: clicksCount,
                subscriptionAttempts: attemptsCount,
                lastUpdated: lastUp
            });

            // 3. Fetch Feedback (from 'feedback' collection)
            const feedbackRef = collection(db, "feedback");
            const feedbackQuery = query(feedbackRef, orderBy("createdAt", "desc"), limit(20));
            const feedbackSnap = await getDocs(feedbackQuery);
            const feedbackData = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeedbackList(feedbackData);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Analytics</h2>
                <p className="text-slate-400 mt-1">App usage and conversion metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Subscription Clicks Card */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <FaFingerprint size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-1 rounded uppercase tracking-wider">Interest</span>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">Subscription Clicks</div>
                    <div className="text-4xl font-bold text-white mt-1">
                        {loading ? "..." : stats.subscriptionClicks}
                    </div>
                    {stats.lastUpdated && (
                        <div className="text-xs text-slate-600 mt-4 pt-4 border-t border-slate-700/50">
                            Last activity: {stats.lastUpdated}
                        </div>
                    )}
                </div>

                {/* Subscription Attempts Card */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <FaClipboardList size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-1 rounded uppercase tracking-wider">Conversion</span>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">Subscription Attempts</div>
                    <div className="text-4xl font-bold text-white mt-1">
                        {loading ? "..." : stats.subscriptionAttempts}
                    </div>
                    <div className="text-xs text-slate-600 mt-4 pt-4 border-t border-slate-700/50">
                        Total attempts recorded
                    </div>
                </div>

                {/* Placeholder/Other Card */}
                <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-600 dashed border-2">
                    <FaChartBar size={32} className="mb-3 opacity-50" />
                    <span className="text-sm">More metrics coming soon</span>
                </div>
            </div>

            {/* Feedback Section */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FaCommentAlt className="text-slate-500" />
                    User Feedback
                </h3>

                {loading ? (
                    <div className="text-slate-500 animate-pulse">Loading feedback...</div>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="p-5">Date</th>
                                    <th className="p-5">User</th>
                                    <th className="p-5">Type</th>
                                    <th className="p-5">Feedback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {feedbackList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-700/30 transition duration-150">
                                        <td className="p-5 text-sm text-slate-400 whitespace-nowrap">
                                            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-white font-medium text-sm">{item.username || 'Anonymous'}</div>
                                            <div className="text-xs text-slate-500">{item.userEmail}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 border border-slate-600">
                                                {item.type || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-slate-300 text-sm">
                                            {item.description}
                                        </td>
                                    </tr>
                                ))}
                                {feedbackList.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-500">
                                            No feedback received yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
