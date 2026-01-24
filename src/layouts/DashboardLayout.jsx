import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FaFutbol, FaUsers, FaChartLine, FaSignOutAlt, FaBell, FaTrophy, FaSatelliteDish } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import logo from "../assets/diskichat_logo.png";

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const navItems = [
        { name: "Live Matches", path: "/", icon: <FaFutbol /> },
        { name: "Fixtures", path: "/fixtures", icon: <FaSatelliteDish /> },
        { name: "Teams", path: "/teams", icon: <FaUsers /> }, // Added Teams
        { name: "Competitions", icon: <FaTrophy />, path: "/competitions" },
        { name: "Users", path: "/users", icon: <FaUsers /> },
        { name: "Notifications", path: "/notifications", icon: <FaBell /> },
        { name: "Analytics", path: "/analytics", icon: <FaChartLine /> },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-gray-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col relative z-20">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={logo} alt="DiskiChat Logo" className="h-10 w-auto object-contain" />
                    </div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider ml-1">Admin Console</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            <span className={`text-xl ${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-medium"
                    >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {/* Top Header */}
                <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-8 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white capitalize">
                            {navItems.find((i) => i.path === location.pathname)?.name || "Dashboard"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition">
                            <FaBell />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-semibold text-white">Administrator</div>
                                <div className="text-xs text-slate-500">Super User</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-slate-900 shadow-sm"></div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20">
                        <div className="absolute top-[-10%] left-[20%] w-[30%] h-[30%] bg-blue-600/30 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="relative z-10 max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
