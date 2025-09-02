import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminFraudLogs() {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    resolved: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [selectedLogs, setSelectedLogs] = useState([]);

  useEffect(() => {
    fetchFraudLogs();
    fetchStatistics();
  }, [filters]);

  const fetchFraudLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await api.get(`/admin/fraud?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to fetch fraud logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data } = await api.get('/admin/fraud/statistics');
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleResolveLog = async (logId, notes = '') => {
    try {
      await api.patch(`/admin/fraud/${logId}/resolve`, { resolutionNotes: notes });
      setShowModal(false);
      setSelectedLog(null);
      setResolutionNotes('');
      fetchFraudLogs();
      fetchStatistics();
    } catch (err) {
      setError('Failed to resolve fraud log');
    }
  };

  const handleUnresolveLog = async (logId) => {
    try {
      await api.patch(`/admin/fraud/${logId}/unresolve`);
      fetchFraudLogs();
      fetchStatistics();
    } catch (err) {
      setError('Failed to unresolve fraud log');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this fraud log?')) return;
    
    try {
      await api.delete(`/admin/fraud/${logId}`);
      fetchFraudLogs();
      fetchStatistics();
    } catch (err) {
      setError('Failed to delete fraud log');
    }
  };

  const handleBulkResolve = async () => {
    if (selectedLogs.length === 0) return;
    
    const notes = window.prompt('Enter resolution notes (optional):');
    if (notes === null) return; // User cancelled
    
    try {
      await api.patch('/admin/fraud/bulk/resolve', {
        logIds: selectedLogs,
        resolutionNotes: notes || 'Bulk resolved'
      });
      setSelectedLogs([]);
      fetchFraudLogs();
      fetchStatistics();
    } catch (err) {
      setError('Failed to bulk resolve fraud logs');
    }
  };

  const handleLogSelect = (logId) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map(log => log._id));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'FaceMismatch': return '👤';
      case 'RepeatVoteAttempt': return '🔄';
      case 'SuspiciousIP': return '🌐';
      case 'MultipleDevices': return '📱';
      case 'AgeEligibilityViolation': return '👶';
      case 'OTPVerificationFailed': return '🔐';
      case 'InvalidVoteOption': return '❌';
      case 'SystemManipulation': return '⚠️';
      case 'UnauthorizedAccess': return '🚫';
      case 'DataTampering': return '🔧';
      default: return '❓';
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/dashboard" style={styles.backLink}>
          <span style={styles.backIcon}>←</span>
          Back to Dashboard
        </Link>
        <h1 style={styles.title}>Fraud Detection & Management</h1>
        <p style={styles.subtitle}>Monitor and manage election fraud attempts</p>
      </div>

      {error && (
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{statistics.total}</div>
              <div style={styles.statLabel}>Total Incidents</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{statistics.resolved}</div>
              <div style={styles.statLabel}>Resolved</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{statistics.unresolved}</div>
              <div style={styles.statLabel}>Unresolved</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>
                {statistics.total > 0 ? ((statistics.resolved / statistics.total) * 100).toFixed(1) : 0}%
              </div>
              <div style={styles.statLabel}>Resolution Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {statistics && (
        <div style={styles.chartsSection}>
          <div style={styles.chartContainer}>
            <h3 style={styles.chartTitle}>📈 Fraud Types Distribution</h3>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(statistics.byType).map(([type, data]) => ({
                      type,
                      count: data.total
                    }))}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(statistics.byType).map((_, index) => (
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
            <h3 style={styles.chartTitle}>🚨 Severity Distribution</h3>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(statistics.bySeverity).map(([severity, data]) => ({
                  severity: severity.charAt(0).toUpperCase() + severity.slice(1),
                  resolved: data.resolved,
                  unresolved: data.unresolved
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resolved" />
                  <Bar dataKey="unresolved" stackId="a" fill="#ef4444" name="Unresolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersCard}>
        <h3 style={styles.filtersTitle}>🔍 Filters</h3>
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Type:</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Types</option>
              <option value="FaceMismatch">Face Mismatch</option>
              <option value="RepeatVoteAttempt">Repeat Vote Attempt</option>
              <option value="SuspiciousIP">Suspicious IP</option>
              <option value="MultipleDevices">Multiple Devices</option>
              <option value="AgeEligibilityViolation">Age Eligibility Violation</option>
              <option value="OTPVerificationFailed">OTP Verification Failed</option>
              <option value="InvalidVoteOption">Invalid Vote Option</option>
              <option value="SystemManipulation">System Manipulation</option>
              <option value="UnauthorizedAccess">Unauthorized Access</option>
              <option value="DataTampering">Data Tampering</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Severity:</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status:</label>
            <select
              value={filters.resolved}
              onChange={(e) => handleFilterChange('resolved', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Per Page:</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLogs.length > 0 && (
        <div style={styles.bulkActionsCard}>
          <span style={styles.bulkActionsText}>
            {selectedLogs.length} log(s) selected
          </span>
          <button
            onClick={handleBulkResolve}
            style={styles.bulkResolveButton}
          >
            Resolve Selected
          </button>
        </div>
      )}

      {/* Fraud Logs Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>🚨 Fraud Logs</h3>
          <button
            onClick={handleSelectAll}
            style={styles.selectAllButton}
          >
            {selectedLogs.length === logs.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>
            <p>Loading fraud logs...</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Select</th>
                  <th style={styles.tableHeaderCell}>Type</th>
                  <th style={styles.tableHeaderCell}>Severity</th>
                  <th style={styles.tableHeaderCell}>User</th>
                  <th style={styles.tableHeaderCell}>Election</th>
                  <th style={styles.tableHeaderCell}>Details</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Date</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log._id)}
                        onChange={() => handleLogSelect(log._id)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.typeCell}>
                        <span style={styles.typeIcon}>{getTypeIcon(log.type)}</span>
                        <span style={styles.typeText}>{log.type}</span>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.severityBadge,
                        backgroundColor: getSeverityColor(log.severity)
                      }}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.userCell}>
                        <div style={styles.userName}>{log.userId?.name || log.userId?.username || 'Unknown'}</div>
                        <div style={styles.userEmail}>{log.userId?.email}</div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.electionCell}>
                        {log.electionId?.title || 'Unknown Election'}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.detailsCell} title={log.details}>
                        {log.details.length > 50 ? `${log.details.substring(0, 50)}...` : log.details}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: log.resolved ? '#10b981' : '#ef4444'
                      }}>
                        {log.resolved ? '✅ Resolved' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.dateCell}>
                        {new Date(log.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionsCell}>
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowModal(true);
                          }}
                          style={styles.actionButton}
                          title="View Details"
                        >
                          👁️
                        </button>
                        {log.resolved ? (
                          <button
                            onClick={() => handleUnresolveLog(log._id)}
                            style={styles.actionButton}
                            title="Unresolve"
                          >
                            ↩️
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResolveLog(log._id)}
                            style={styles.actionButton}
                            title="Resolve"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          style={styles.actionButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              style={styles.paginationButton}
            >
              Previous
            </button>
            <span style={styles.paginationInfo}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              style={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal for Log Details */}
      {showModal && selectedLog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Fraud Log Details</h3>
              <button
                onClick={() => setShowModal(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Basic Information</h4>
                <div style={styles.modalGrid}>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Type:</label>
                    <span style={styles.modalValue}>
                      {getTypeIcon(selectedLog.type)} {selectedLog.type}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Severity:</label>
                    <span style={{
                      ...styles.severityBadge,
                      backgroundColor: getSeverityColor(selectedLog.severity)
                    }}>
                      {selectedLog.severity.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Status:</label>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: selectedLog.resolved ? '#10b981' : '#ef4444'
                    }}>
                      {selectedLog.resolved ? '✅ Resolved' : '⏳ Pending'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Date:</label>
                    <span style={styles.modalValue}>
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>User Information</h4>
                <div style={styles.modalGrid}>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Name:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.userId?.name || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Username:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.userId?.username || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Email:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.userId?.email || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Date of Birth:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.userId?.dateOfBirth ? new Date(selectedLog.userId.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Election Information</h4>
                <div style={styles.modalGrid}>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Title:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.electionId?.title || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>Start Time:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.electionId?.startTime ? new Date(selectedLog.electionId.startTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>End Time:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.electionId?.endTime ? new Date(selectedLog.electionId.endTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Technical Details</h4>
                <div style={styles.modalGrid}>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>IP Address:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.ipAddress || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalField}>
                    <label style={styles.modalLabel}>User Agent:</label>
                    <span style={styles.modalValue}>
                      {selectedLog.userAgent || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Details</h4>
                <div style={styles.modalDetails}>
                  {selectedLog.details}
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div style={styles.modalSection}>
                  <h4 style={styles.modalSectionTitle}>Metadata</h4>
                  <pre style={styles.modalMetadata}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.resolved && (
                <div style={styles.modalSection}>
                  <h4 style={styles.modalSectionTitle}>Resolution Information</h4>
                  <div style={styles.modalGrid}>
                    <div style={styles.modalField}>
                      <label style={styles.modalLabel}>Resolved By:</label>
                      <span style={styles.modalValue}>
                        {selectedLog.resolvedBy?.name || selectedLog.resolvedBy?.username || 'N/A'}
                      </span>
                    </div>
                    <div style={styles.modalField}>
                      <label style={styles.modalLabel}>Resolved At:</label>
                      <span style={styles.modalValue}>
                        {selectedLog.resolvedAt ? new Date(selectedLog.resolvedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedLog.resolutionNotes && (
                    <div style={styles.modalField}>
                      <label style={styles.modalLabel}>Resolution Notes:</label>
                      <div style={styles.modalDetails}>
                        {selectedLog.resolutionNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedLog.resolved && (
                <div style={styles.modalSection}>
                  <h4 style={styles.modalSectionTitle}>Resolution</h4>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    style={styles.resolutionTextarea}
                  />
                  <div style={styles.modalActions}>
                    <button
                      onClick={() => handleResolveLog(selectedLog._id, resolutionNotes)}
                      style={styles.resolveButton}
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

  errorCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  errorIcon: {
    fontSize: '20px'
  },

  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },

  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },

  statIcon: {
    fontSize: '32px'
  },

  statContent: {
    flex: 1
  },

  statNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1'
  },

  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px'
  },

  chartsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
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

  filtersCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  filtersTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0'
  },

  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },

  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },

  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: 'white'
  },

  bulkActionsCard: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  bulkActionsText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#92400e'
  },

  bulkResolveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  tableCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden'
  },

  tableHeader: {
    padding: '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  tableTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  selectAllButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  loadingCard: {
    padding: '40px',
    textAlign: 'center'
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },

  tableContainer: {
    overflowX: 'auto'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  tableHeaderCell: {
    backgroundColor: '#f8fafc',
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e2e8f0'
  },

  tableRow: {
    borderBottom: '1px solid #e2e8f0'
  },

  tableCell: {
    padding: '16px',
    fontSize: '14px',
    verticalAlign: 'top'
  },

  checkbox: {
    width: '16px',
    height: '16px'
  },

  typeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  typeIcon: {
    fontSize: '16px'
  },

  typeText: {
    fontSize: '12px',
    fontWeight: '500'
  },

  severityBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase'
  },

  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },

  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b'
  },

  userEmail: {
    fontSize: '12px',
    color: '#64748b'
  },

  electionCell: {
    fontSize: '14px',
    color: '#1e293b'
  },

  detailsCell: {
    fontSize: '12px',
    color: '#64748b',
    maxWidth: '200px'
  },

  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'white'
  },

  dateCell: {
    fontSize: '12px',
    color: '#64748b'
  },

  actionsCell: {
    display: 'flex',
    gap: '4px'
  },

  actionButton: {
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },

  pagination: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    borderTop: '1px solid #f1f5f9'
  },

  paginationButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },

  paginationInfo: {
    fontSize: '14px',
    color: '#64748b'
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },

  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
  },

  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  modalCloseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b'
  },

  modalContent: {
    padding: '24px'
  },

  modalSection: {
    marginBottom: '24px'
  },

  modalSectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },

  modalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },

  modalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  modalLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase'
  },

  modalValue: {
    fontSize: '14px',
    color: '#1e293b'
  },

  modalDetails: {
    fontSize: '14px',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  modalMetadata: {
    fontSize: '12px',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'auto',
    maxHeight: '200px'
  },

  resolutionTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    resize: 'vertical',
    marginBottom: '16px'
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },

  resolveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .actionButton:hover {
    background-color: #f3f4f6;
  }
  
  .paginationButton:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`;
document.head.appendChild(styleSheet);
