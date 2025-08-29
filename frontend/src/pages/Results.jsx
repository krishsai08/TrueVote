import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // your axios/fetch wrapper

export default function Results() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedElectionObj, setSelectedElectionObj] = useState(null);

  // Fetch all elections on mount
  useEffect(() => {
    api.get('/admin/elections')
      .then(res => setElections(res.data))
      .catch(() => setError('Failed to fetch elections'));
  }, []);

  // Fetch results when election changes
  useEffect(() => {
  if (!selectedElection) {
    setResults([]);
    return;
  }
  setLoading(true);
  api.get(`/admin/results/${selectedElection}`)
    .then(res => {
      console.log("Results API:", res.data); // 👀 inspect structure

      // Try to normalize response
      const raw = res.data.totals || res.data.results || res.data || [];
      const normalized = raw.map(r => ({
        candidate: r.candidate || r.option || r._id || "Unknown",
        count: r.count || r.votes || 0,
      }));

      const sorted = normalized.sort((a, b) => b.count - a.count);
      setResults(sorted);
    })
    .catch(() => setError("Failed to fetch results"))
    .finally(() => setLoading(false));
}, [selectedElection]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Election Analytics</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <select
        value={selectedElection}
        onChange={e => setSelectedElection(e.target.value)}
        style={{ marginBottom: 16, padding: 8 }}
      >
        <option value="">-- Select an election --</option>
        {elections.map(e => (
          <option key={e._id} value={e._id}>{e.title}</option>
        ))}
      </select>

      {loading && <p>Loading results...</p>}

      {!loading && results.length > 0 && (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Option</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              // map candidate ID -> option text
              let optionLabel = r.candidate;
              if (selectedElectionObj && selectedElectionObj.candidates) {
                const idx = parseInt(r.candidate, 10) - 1;
                if (!isNaN(idx) && selectedElectionObj.candidates[idx]) {
                  optionLabel = selectedElectionObj.candidates[idx];
                }
              }

              return (
                <tr key={r.candidate}>
                  <td>{optionLabel}</td>
                  <td>{r.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && selectedElection && results.length === 0 && <p>No votes yet.</p>}
    </div>
  );
}
