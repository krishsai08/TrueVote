import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // your axios/fetch wrapper

export default function Results() {
  const [elections, setElections] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch all elections on mount
  useEffect(() => {
    api.get('/admin/elections')
      .then(res => setElections(res.data))
      .catch(() => setError('Failed to fetch elections'));
  }, []);

  const handleElectionSelect = (e) => {
    const electionId = e.target.value;
    if (electionId) {
      navigate(`/admin/elections/${electionId}`); // ✅ Navigate to ElectionDetails
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Election Analytics</h2>

      {error && <p style={styles.error}>{error}</p>}

      <select
        defaultValue=""
        onChange={handleElectionSelect}
        style={styles.select}
      >
        <option value="">-- Select an election --</option>
        {elections.map(e => (
          <option key={e._id} value={e._id}>{e.title}</option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",      // Center horizontally
    justifyContent: "center", // Center vertically
    height: "100vh",          // Full screen height
    background: "linear-gradient(135deg, #f9f9f9, #e0f7fa)",
  },
  heading: {
    fontSize: "28px",
    color: "#00796b",
    marginBottom: "20px",
  },
  error: {
    color: "red",
    marginBottom: "10px",
  },
  select: {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "2px solid #00796b",
    backgroundColor: "#ffffff",
    color: "#333",
    fontSize: "16px",
    cursor: "pointer",
    outline: "none",
    transition: "0.3s",
  }
};
