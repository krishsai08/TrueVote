import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [elections, setElections] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const { user, logout } = useAuth();

  // Fetch all elections
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/elections');
        setElections(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Fetch user's votes
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get('/auth/my-votes');
        setMyVotes(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Welcome {user?.name}</h2>
      <button style={styles.logoutBtn} onClick={logout}>Logout</button>

      <div style={styles.section}>
        <h3>Elections</h3>
        <ul>
          {elections.map(e => (
            <li key={e._id}>
              <b>{e.title}</b> — {e.status}{' '}
              {e.status === 'ongoing' && <Link to={`/vote/${e._id}`}>Vote</Link>}
            </li>
          ))}
        </ul>
      </div>

      {user?.role === 'admin' && (
        <div style={styles.section}>
          <h3>Admin Panel</h3>
          <p>
            <Link to="/admin/elections">Manage Elections</Link> |{' '}
            <Link to="/admin/results">View Analytics</Link>
          </p>
        </div>
      )}

      {user?.role === 'user' && (
        <div style={styles.section}>
          <h3>My Votes</h3>
          {myVotes.length ? (
            <ul>
              {myVotes.map((v, idx) => (
                <li key={idx}>
                  <b>{v.election}</b> — Voted for: <b>{v.option}</b> on{' '}
                  {new Date(v.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No votes cast yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: 800,
    margin: '20px auto',
    padding: 20,
    backgroundColor: '#f7f9fc',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  heading: { marginBottom: 12, color: '#333' },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 20
  },
  section: { marginTop: 24 }
};
