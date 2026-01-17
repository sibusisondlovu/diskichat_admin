import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import Notifications from "./pages/Notifications";
import Competitions from "./pages/Competitions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Matches />} />
          <Route path="/match/:id" element={<MatchDetails />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user/:id" element={<UserDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/analytics" element={<div className="text-white p-8">Analytics Coming Soon</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
