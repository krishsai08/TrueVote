import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vote from './pages/Vote';
import AdminElections from './pages/AdminElections';
import Results from './pages/Results';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <Link style={styles.link} to="/">Home</Link>

        {!user && <Link style={styles.link} to="/login">Login</Link>}
        {!user && <Link style={styles.link} to="/register">Register</Link>}

        {user && <Link style={styles.link} to="/dashboard">Dashboard</Link>}

        {user?.role === 'admin' && <Link style={styles.link} to="/admin/elections">Manage Elections</Link>}
        {user?.role === 'admin' && <Link style={styles.link} to="/admin/results">Analytics</Link>}
      </nav>

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/vote/:electionId" element={<PrivateRoute><Vote /></PrivateRoute>} />
          <Route path="/admin/elections" element={<PrivateRoute roles={['admin']}><AdminElections /></PrivateRoute>} />
          <Route path="/admin/results" element={<PrivateRoute roles={['admin']}><Results /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    padding: '20px',
  },
  navbar: {
    display: 'flex',
    gap: '16px',
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: 24,
  },
  link: {
    textDecoration: 'none',
    color: '#4b9ce2',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  content: {
    padding: '0 10px',
  }
};
