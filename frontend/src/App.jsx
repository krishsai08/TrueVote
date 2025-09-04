import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vote from "./pages/Vote";
import AdminElections from "./pages/AdminElections";
import Results from "./pages/Results";
import ElectionDetails from "./pages/ElectionDetails";
import UserResults from "./pages/UserResults";
import UserProfile from "./pages/UserProfile";
import AdminResults from "./pages/AdminResults";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminFraudLogs from "./pages/AdminFraudLogs";
import ConnectionStatus from "./components/ConnectionStatus";
import ResultsGuard from "./components/ResultsGuard";
import SessionTimeout from "./components/SessionTimeout";
import { useAuth } from "./context/AuthContext";

// 🔒 Wrapper for protected routes
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div style={styles.container}>
        {/* WebSocket Connection Status */}
        {user && <ConnectionStatus />}
        
        {/* Session Timeout Warning */}
        {user && <SessionTimeout />}

        {/* Navigation */}
        <nav style={styles.navbar}>
          <div style={styles.leftNav}>
            <Link style={styles.link} to="/">Home</Link>

            {!user && (
              <>
                <Link style={styles.link} to="/login">Login</Link>
                <Link style={styles.link} to="/register">Register</Link>
              </>
            )}

            {user && <Link style={styles.link} to="/dashboard">Dashboard</Link>}

            {user?.role === "admin" && (
              <>
                <Link style={styles.link} to="/admin/elections">Manage Elections</Link>
                <Link style={styles.link} to="/admin/results">Analytics</Link>
                <Link style={styles.link} to="/admin/fraud-logs">Fraud Logs</Link>
                <Link style={styles.link} to="/admin/announcements">Announcements</Link>
              </>
            )}
          </div>

          {user && (
            <div style={styles.rightNav}>
              <Link style={styles.profileLink} to="/profile">👤 {user.name}</Link>
              <button style={styles.logoutBtn} onClick={logout}>Logout</button>
            </div>
          )}
        </nav>

        {/* Routes */}
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/vote/:electionId" element={<PrivateRoute><Vote /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />

            {/* Admin-only */}
            <Route path="/admin/elections" element={<PrivateRoute roles={["admin"]}><AdminElections /></PrivateRoute>} />
            <Route path="/admin/elections/:id" element={<PrivateRoute roles={["admin"]}><ElectionDetails /></PrivateRoute>} />
            <Route path="/admin/results" element={<PrivateRoute roles={["admin"]}><AdminResults /></PrivateRoute>} />
            <Route path="/admin/fraud-logs" element={<PrivateRoute roles={["admin"]}><AdminFraudLogs /></PrivateRoute>} />
            <Route path="/admin/announcements" element={<PrivateRoute roles={["admin"]}><AdminAnnouncements /></PrivateRoute>} />

            {/* User results */}
            <Route path="/results/:id" element={
              <PrivateRoute roles={["user", "admin"]}>
                <ResultsGuard>
                  <UserResults />
                </ResultsGuard>
              </PrivateRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const styles = {
  container: { fontFamily: "Arial, sans-serif", backgroundColor: "#f5f7fa", minHeight: "100vh", padding: "20px" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" },
  leftNav: { display: "flex", gap: "16px" },
  rightNav: { display: "flex", alignItems: "center", gap: "12px" },
  link: { textDecoration: "none", color: "#4b9ce2", fontWeight: 500, transition: "color 0.2s" },
  profileLink: { textDecoration: "none", color: "#333", fontWeight: "bold", transition: "color 0.2s" },
  logoutBtn: { backgroundColor: "#f44336", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "500" },
  content: { padding: "0 10px" },
};
