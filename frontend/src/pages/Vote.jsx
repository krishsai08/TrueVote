import React, { useState, useEffect } from 'react';
import api from '../api/client';
import FaceCapture from '../components/FaceCapture';
import { useParams } from 'react-router-dom';

export default function Vote() {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [faceVerified, setFaceVerified] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const { data } = await api.get(`/elections/${electionId}`);
        setElection(data);
      } catch (err) {
        setMsg(err?.response?.data?.message || 'Error fetching election');
      }
    };
    fetchElection();
  }, [electionId]);

  const submitVote = async () => {
    if (!selectedCandidate) return setMsg('Select a candidate');
    if (!faceVerified) return setMsg('Please verify your face');

    try {
      // Ensure we send exactly what's stored
      const candidate = election.candidates.find(c => c === selectedCandidate);

      if (!candidate) {
        return setMsg('Invalid candidate option');
      }

      await api.post(`/votes/${electionId}`, { candidate, faceVerified });
      setMsg('Vote cast successfully!');
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error casting vote');
    }
  };

  if (!election) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h2>{election.title}</h2>
      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {election.candidates.map(c => (
          <button
            key={c}
            style={{
              padding: 12,
              borderRadius: 8,
              border: selectedCandidate === c ? '2px solid #4b9ce2' : '1px solid #ccc',
              backgroundColor: selectedCandidate === c ? '#e0f0ff' : '#fff',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedCandidate(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Face Capture */}
      <FaceCapture
        onEmbedding={() => setFaceVerified(true)} 
        buttonText={faceVerified ? 'Face Verified' : 'Verify Face'}
      />

      <button
        onClick={submitVote}
        style={{
          marginTop: 20,
          padding: 12,
          width: '100%',
          borderRadius: 8,
          border: 'none',
          backgroundColor: '#4b9ce2',
          color: '#fff',
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        Submit Vote
      </button>

      {msg && <p style={{ marginTop: 10, color: 'crimson' }}>{msg}</p>}
    </div>
  );
}
