import { useState } from "react";
import { FaPaperPlane, FaBell } from "react-icons/fa";

// TODO: Move to backend or use Environment Variables in production
// CAUTION: Exposing REST API Key in frontend is risky. 
// For this MVP/Admin panel (which is restricted), we might do it client-side 
// but ideally this should proxy through a Cloud Function.
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID";
const ONESIGNAL_REST_API_KEY = "YOUR_ONESIGNAL_REST_API_KEY";

export default function Notifications() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: '' }

    const sendNotification = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ['All'], // Or specific segments
                headings: { en: title },
                contents: { en: message },
                // data: { type: 'match_alert' } // Optional custom data
            })
        };

        try {
            const response = await fetch('https://onesignal.com/api/v1/notifications', options);
            const data = await response.json();

            if (response.ok && !data.errors) {
                setStatus({ type: 'success', msg: `Notification sent! ID: ${data.id}` });
                setTitle("");
                setMessage("");
            } else {
                setStatus({ type: 'error', msg: `Error: ${JSON.stringify(data.errors)}` });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: "Network error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <FaBell size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Push Notifications</h2>
                <p className="text-slate-400 mt-2">Engage directly with global DiskiChat users</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-xl p-8">

                {/* Warning about Keys */}
                {ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID" && (
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-8 text-sm text-yellow-200">
                        <strong className="text-yellow-400">Configuration Required:</strong> Please set your OneSignal keys in <code>src/pages/Notifications.jsx</code>.
                    </div>
                )}

                {status && (
                    <div className={`p-4 rounded-xl mb-8 text-sm font-medium border flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {status.msg}
                    </div>
                )}

                <form onSubmit={sendNotification} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Notification Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="e.g. Kaizer Chiefs vs Pirates is LIVE!"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Message Content</label>
                        <textarea
                            required
                            rows="4"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                            placeholder="e.g. Join the banter room now and support your team..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID"}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${loading || ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID"
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/30'
                            }`}
                    >
                        {loading ? 'Sending Broadcast...' : (
                            <>
                                <FaPaperPlane /> Send Broadcast
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-slate-600 font-medium">
                <p>Secured by OneSignal REST API</p>
            </div>
        </div>
    );
}
