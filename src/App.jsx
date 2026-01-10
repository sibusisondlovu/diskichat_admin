import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import Matches from "./pages/Matches";
const Users = () => <div><h2 className="text-2xl font-bold mb-4">Users</h2><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">User Management implementation pending...</div></div>;
const Notifications = () => <div><h2 className="text-2xl font-bold mb-4">Push Notifications</h2><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">Notification sender implementation pending...</div></div>;
const Analytics = () => <div><h2 className="text-2xl font-bold mb-4">Analytics</h2><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">Analytics dashboard implementation pending...</div></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Matches />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
