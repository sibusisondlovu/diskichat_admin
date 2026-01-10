import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FaFutbol, FaUsers, FaChartLine, FaSignOutAlt, FaBell } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const navItems = [
        { name: "Live Matches", path: "/", icon: <FaFutbol /> }, // Matches & Match of Day
        { name: "Users", path: "/users", icon: <FaUsers /> },
        { name: "Push Notifications", path: "/notifications", icon: <FaBell /> },
        { name: "Analytics", path: "/analytics", icon: <FaChartLine /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col">
                <div className="p-6 text-2xl font-bold tracking-tight border-b border-gray-700 flex items-center gap-2">
                    <span className="text-accent">Diski</span>Chat
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                    ? "bg-accent text-white"
                                    : "hover:bg-gray-800 text-gray-300"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-600/80 text-gray-300 hover:text-white transition-all"
                    >
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-700">
                        {navItems.find((i) => i.path === location.pathname)?.name || "Dashboard"}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">Admin</div>
                        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    </div>
                </header>

                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
