import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import socketManager from "../utils/socket.js";

export default function ElectionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch election info
        const { data } = await api.get(user.role === "admin" ? `/admin/elections/${id}` : `/elections/user/${id}`);
        setElection(data.election);

        // Fetch results if admin or if results are released
        if (user.role === "admin") {
          const { data: res } = await api.get(`/admin/results/${id}`);
          setResults(res.results || []);
        } else if (data.election.resultsReleased) {
          const { data: res } = await api.get(`/elections/${id}/results/public`);
          setResults(res.results || []);
        }
      } catch (err) {
        if (err.response?.status === 404) setMsg("Election not found");
        else if (err.response?.status === 403) setMsg("Results not yet released");
        else setMsg(err?.response?.data?.message || "Error loading election details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Connect to WebSocket
    socketManager.connect();
    socketManager.joinElection(id);

    // Join appropriate room based on user role
    if (user.role === 'admin') {
      socketManager.joinAdmin();
    } else {
      socketManager.joinUser(user.id);
    }

    // Listen for real-time updates
    const handleVoteCast = (data) => {
      if (data.electionId === id) {
        setResults(data.results);
        setMsg(`New vote cast! Total votes: ${data.totalVotes}`);
        setTimeout(() => setMsg(''), 3000); // Clear message after 3 seconds
      }
    };

    const handleResultsReleased = (data) => {
      if (data.electionId === id) {
        setElection(prev => ({ ...prev, resultsReleased: true }));
        setMsg('Results have been released!');
        setTimeout(() => setMsg(''), 3000);
      }
    };

    const handleElectionSuspended = (data) => {
      if (data.electionId === id) {
        setElection(prev => ({ ...prev, status: 'suspended' }));
        setMsg('Election has been suspended');
        setTimeout(() => setMsg(''), 3000);
      }
    };

    const handleElectionResumed = (data) => {
      if (data.electionId === id) {
        setElection(prev => ({ ...prev, status: 'active' }));
        setMsg('Election has been resumed');
        setTimeout(() => setMsg(''), 3000);
      }
    };

    // Set up event listeners
    socketManager.on('vote-cast', handleVoteCast);
    socketManager.on('results-released', handleResultsReleased);
    socketManager.on('election-suspended', handleElectionSuspended);
    socketManager.on('election-resumed', handleElectionResumed);

    // Cleanup function
    return () => {
      socketManager.leaveElection(id);
      socketManager.off('vote-cast', handleVoteCast);
      socketManager.off('results-released', handleResultsReleased);
      socketManager.off('election-suspended', handleElectionSuspended);
      socketManager.off('election-resumed', handleElectionResumed);
    };
  }, [id, user]);

  const releaseResults = async () => {
    try {
      await api.patch(`/admin/elections/${id}/release-results`);
      setElection(prev => ({ ...prev, resultsReleased: true }));
      setMsg("Results released successfully!");

      // Fetch updated results immediately
      const { data: res } = await api.get(`/admin/results/${id}`);
      setResults(res.results || []);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to release results");
    }
  };

  const deleteElection = async () => {
    try {
      await api.delete(`/admin/elections/${id}`);
      setMsg("Election deleted successfully! Redirecting...");
      setTimeout(() => {
        navigate('/admin/elections');
      }, 1500);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to delete election");
    }
  };

  const handleDownloadPDF = async () => {
    if (!election || results.length === 0) return;
    
    setDownloadingPDF(true);
    try {
      const response = await api.get(`/elections/${id}/results/pdf`, {
        responseType: 'blob'
      });
      
      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `election-results-${election.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      setMsg(`Failed to download PDF: ${error.message}. Please try again.`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!election) return <p>{msg}</p>;

  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#d45087", "#a05195"];

  return (
    <div style={styles.container}>
      <Link to={user.role === "admin" ? "/admin/elections" : "/dashboard"} style={styles.backLink}>
        ← Back
      </Link>
      <h2>{election.title}</h2>
      <p><strong>Status:</strong> {election.status}</p>
      <p><strong>Results Released:</strong> {election.resultsReleased ? "Yes" : "No"}</p>
      <p><strong>Start Time:</strong> {new Date(election.startTime).toLocaleString()}</p>
      <p><strong>End Time:</strong> {new Date(election.endTime).toLocaleString()}</p>
      <p><strong>Total Votes:</strong> {totalVotes}</p>

      {user.role === "admin" && (
        <div style={styles.adminActions}>
          {!election.resultsReleased && (
            <button style={styles.releaseBtn} onClick={releaseResults}>Release Results</button>
          )}
          {results.length > 0 && (
            <button 
              style={styles.downloadBtn} 
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? '⏳ Generating PDF...' : '📄 Download PDF'}
            </button>
          )}
          <button style={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>Delete Election</button>
        </div>
      )}

      {results && results.length > 0 ? (
        <>
          <h3>Candidate Results</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.candidate}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={results}
                  dataKey="count"
                  nameKey="candidate"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {results.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p>No results available yet.</p>
      )}

      {!election.resultsReleased && user.role !== "admin" && (
        <p style={{ color: "red" }}>Results are not released yet.</p>
      )}

      {msg && <p style={{ color: user.role === "admin" ? "green" : "red" }}>{msg}</p>}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={styles.popupTitle}>⚠️ Delete Election</h3>
            <p style={styles.popupText}>
              Are you sure you want to delete <strong>"{election.title}"</strong>?
            </p>
            <p style={styles.popupWarning}>
              This action cannot be undone. All votes and data associated with this election will be permanently removed.
            </p>
            <div style={styles.popupActions}>
              <button style={styles.confirmDeleteBtn} onClick={deleteElection}>
                Delete Permanently
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    maxWidth: "900px",
    margin: "30px auto",
  },
  backLink: {
    display: "inline-block",
    marginBottom: "15px",
    textDecoration: "none",
    color: "#2980b9",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "25px",
  },
  releaseBtn: {
    backgroundColor: "#f39c12",
    color: "#fff",
    padding: "8px 15px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  adminActions: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "8px 15px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  downloadBtn: {
    backgroundColor: "#667eea",
    color: "#fff",
    padding: "8px 15px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  popup: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    maxWidth: "500px",
    width: "90%",
    textAlign: "center"
  },
  popupTitle: {
    color: "#e74c3c",
    marginBottom: "16px",
    fontSize: "1.25rem"
  },
  popupText: {
    marginBottom: "12px",
    fontSize: "1rem"
  },
  popupWarning: {
    color: "#e74c3c",
    marginBottom: "20px",
    fontSize: "0.875rem",
    fontStyle: "italic"
  },
  popupActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  confirmDeleteBtn: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  },
  cancelBtn: {
    backgroundColor: "#95a5a6",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  }
};
