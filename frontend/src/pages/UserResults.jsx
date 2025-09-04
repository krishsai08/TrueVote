import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function UserResults() {
  const { id } = useParams();
  const { user } = useAuth();
  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchElectionAndResults = async () => {
      try {
        // Fetch election info
        const { data } = await api.get(`/elections/user/${id}`);
        setElection(data.election);

        // Check if results are released before attempting to fetch
        if (!data.election.resultsReleased) {
          setMsg("Results are not yet released for this election. Please wait for the administrator to release the results.");
          setLoading(false);
          return;
        }

        // Fetch public results only if released
        const { data: res } = await api.get(`/elections/${id}/results/public`);
        setResults(res.results || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setMsg("Election not found.");
        } else if (err.response?.status === 403) {
          setMsg("Results are not yet released for this election. Please wait for the administrator to release the results.");
        } else {
          setMsg(err?.response?.data?.message || "Error loading results");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchElectionAndResults();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!election || !election.resultsReleased) return;
    
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



  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading results...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <p style={styles.errorText}>{msg}</p>
        <Link to="/dashboard" style={styles.backButton}>← Back to Dashboard</Link>
      </div>
    );
  }

  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/dashboard" style={styles.backLink}>
          <span style={styles.backIcon}>←</span>
          Back to Dashboard
        </Link>
        <h1 style={styles.title}>Election Results</h1>
        <p style={styles.subtitle}>View the official results for this election</p>
        
        {election && election.resultsReleased && results.length > 0 && user?.role === 'admin' && (
          <div style={styles.downloadSection}>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              style={{
                ...styles.downloadButton,
                ...(downloadingPDF && styles.downloadButtonLoading)
              }}
            >
              {downloadingPDF ? (
                <>
                  <span style={styles.downloadSpinner}>⏳</span>
                  Generating PDF...
                </>
              ) : (
                <>
                  <span style={styles.downloadIcon}>📄</span>
                  Download Results PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Election Info Card */}
      <div style={styles.electionInfoCard}>
        <div style={styles.electionHeader}>
          <h2 style={styles.electionTitle}>{election.title}</h2>
          <div style={{
            ...styles.statusBadge,
            backgroundColor: election.status === 'closed' ? '#ef4444' : '#10b981'
          }}>
            {election.status === 'closed' ? '🔴 Closed' : '🟢 Active'}
          </div>
        </div>
        
        <div style={styles.electionDetails}>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>📅</span>
            <div>
              <div style={styles.detailLabel}>Start Date</div>
              <div style={styles.detailValue}>
                {new Date(election.startTime).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>📅</span>
            <div>
              <div style={styles.detailLabel}>End Date</div>
              <div style={styles.detailValue}>
                {new Date(election.endTime).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>🗳️</span>
            <div>
              <div style={styles.detailLabel}>Total Votes</div>
              <div style={styles.detailValue}>{totalVotes}</div>
            </div>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>👥</span>
            <div>
              <div style={styles.detailLabel}>Candidates</div>
              <div style={styles.detailValue}>{results.length}</div>
            </div>
          </div>
        </div>
      </div>

      {!election.resultsReleased ? (
        <div style={styles.notReleasedCard}>
          <span style={styles.notReleasedIcon}>🔒</span>
          <h3 style={styles.notReleasedTitle}>Results Not Yet Released</h3>
          <p style={styles.notReleasedText}>
            The results for this election have not been released yet by the administrator. 
            Please wait for the official announcement before viewing results.
          </p>
          <div style={styles.notReleasedInfo}>
            <p style={styles.notReleasedNote}>
              <strong>Note:</strong> Results will be made available to all users once the administrator releases them.
            </p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div style={styles.resultsContainer}>
          {/* Top 2 Candidates Section */}
          {results.length >= 2 && (
            <div style={styles.topCandidatesSection}>
              <h3 style={styles.sectionTitle}>🏆 Top 2 Candidates</h3>
              <div style={styles.topCandidatesGrid}>
                {results.slice(0, 2).map((result, index) => (
                  <div key={index} style={styles.topCandidateCard}>
                    <div style={styles.rankBadge}>
                      {index === 0 ? '🥇' : '🥈'}
                    </div>
                    <h4 style={styles.candidateName}>{result.candidate}</h4>
                    <div style={styles.voteCount}>
                      <span style={styles.voteNumber}>{result.count}</span>
                      <span style={styles.voteLabel}>votes</span>
                    </div>
                    <div style={styles.percentage}>
                      {((result.count / totalVotes) * 100).toFixed(1)}%
                    </div>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${(result.count / totalVotes) * 100}%`,
                          backgroundColor: index === 0 ? '#fbbf24' : '#6b7280'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Results Table */}
          <div style={styles.resultsTableSection}>
            <h3 style={styles.sectionTitle}>📊 Complete Results</h3>
            <div style={styles.tableContainer}>
              <table style={styles.resultsTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Rank</th>
                    <th style={styles.tableHeader}>Candidate</th>
                    <th style={styles.tableHeader}>Votes</th>
                    <th style={styles.tableHeader}>Percentage</th>
                    <th style={styles.tableHeader}>Bar Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} style={index < 2 ? styles.topRow : styles.regularRow}>
                      <td style={styles.rankCell}>
                        <span style={styles.rankNumber}>{index + 1}</span>
                        {index < 2 && <span style={styles.medalIcon}>
                          {index === 0 ? '🥇' : '🥈'}
                        </span>}
                      </td>
                      <td style={styles.candidateCell}>{result.candidate}</td>
                      <td style={styles.voteCell}>{result.count}</td>
                      <td style={styles.percentageCell}>
                        {((result.count / totalVotes) * 100).toFixed(1)}%
                      </td>
                      <td style={styles.barCell}>
                        <div style={styles.barContainer}>
                          <div 
                            style={{
                              ...styles.barFill,
                              width: `${(result.count / totalVotes) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          <div style={styles.chartsSection}>
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>📈 Vote Distribution (Pie Chart)</h3>
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={results}
                      dataKey="count"
                      nameKey="candidate"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ candidate, percent }) => `${candidate} ${(percent * 100).toFixed(0)}%`}
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
            </div>

            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>📊 Vote Comparison (Bar Chart)</h3>
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="candidate" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <h3 style={styles.emptyTitle}>No Results Available</h3>
          <p style={styles.emptyText}>
            This election doesn't have any votes yet or results haven't been processed.
          </p>
        </div>
      )}

      {msg && (
        <div style={styles.messageCard}>
          <span style={styles.messageIcon}>ℹ️</span>
          {msg}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  },

  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },

  loadingText: {
    fontSize: '1.125rem',
    color: '#64748b',
    margin: 0
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    textAlign: 'center'
  },

  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },

  errorText: {
    fontSize: '1.125rem',
    color: '#ef4444',
    margin: '0 0 20px 0'
  },

  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#3b82f6',
    fontWeight: '500',
    padding: '12px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },

  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: '16px',
    fontSize: '14px'
  },

  backIcon: {
    fontSize: '18px'
  },

  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },

  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    margin: 0
  },

  downloadSection: {
    marginTop: '20px'
  },

  downloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    textDecoration: 'none'
  },

  downloadButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none'
  },

  downloadIcon: {
    fontSize: '20px'
  },

  downloadSpinner: {
    fontSize: '20px',
    animation: 'spin 1s linear infinite'
  },



  electionInfoCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  electionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },

  electionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white'
  },

  electionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },

  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },

  detailIcon: {
    fontSize: '24px'
  },

  detailLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px'
  },

  detailValue: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b'
  },

  notReleasedCard: {
    backgroundColor: 'white',
    padding: '40px 24px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  notReleasedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    display: 'block'
  },

  notReleasedTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },

  notReleasedText: {
    fontSize: '1rem',
    color: '#64748b',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },

  notReleasedInfo: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px'
  },

  notReleasedNote: {
    fontSize: '0.875rem',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.4'
  },

  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },

  topCandidatesSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  topCandidatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },

  topCandidateCard: {
    backgroundColor: '#f8fafc',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.3s ease'
  },

  rankBadge: {
    fontSize: '32px',
    marginBottom: '16px'
  },

  candidateName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },

  voteCount: {
    marginBottom: '16px'
  },

  voteNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#3b82f6',
    display: 'block'
  },

  voteLabel: {
    fontSize: '14px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  percentage: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#059669',
    marginBottom: '16px'
  },

  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },

  resultsTableSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  tableContainer: {
    overflowX: 'auto'
  },

  resultsTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  tableHeader: {
    backgroundColor: '#f8fafc',
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e2e8f0'
  },

  topRow: {
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #fbbf24'
  },

  regularRow: {
    borderBottom: '1px solid #e2e8f0'
  },

  rankCell: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  rankNumber: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b'
  },

  medalIcon: {
    fontSize: '16px'
  },

  candidateCell: {
    padding: '16px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1e293b'
  },

  voteCell: {
    padding: '16px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center'
  },

  percentageCell: {
    padding: '16px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#059669',
    textAlign: 'center'
  },

  barCell: {
    padding: '16px',
    width: '200px'
  },

  barContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden'
  },

  barFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease'
  },

  chartsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px'
  },

  chartContainer: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0'
  },

  chartWrapper: {
    width: '100%',
    height: '300px'
  },

  emptyState: {
    backgroundColor: 'white',
    padding: '60px 24px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    display: 'block'
  },

  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 8px 0'
  },

  emptyText: {
    fontSize: '1rem',
    margin: 0,
    lineHeight: '1.5',
    color: '#64748b'
  },

  messageCard: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    padding: '16px',
    borderRadius: '12px',
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  messageIcon: {
    fontSize: '20px'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .topCandidateCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
  
  .backButton:hover {
    background-color: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .topRow {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }
  
  .downloadButton:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  }
  

`;
document.head.appendChild(styleSheet);
