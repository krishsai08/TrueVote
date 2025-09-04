import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from "react-router-dom";
import socketManager from '../utils/socket.js';

export default function AdminElections() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: '',
    candidatesCSV: '',
    startTime: '',
    endTime: '',
    ageGroups: []
  });
  const [msg, setMsg] = useState('');

  // popup states
  const [extendPopup, setExtendPopup] = useState({ open: false, id: null });
  const [extendDate, setExtendDate] = useState('');
  const [suspendPopup, setSuspendPopup] = useState({ open: false, id: null });
  const [deletePopup, setDeletePopup] = useState({ open: false, id: null, title: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/admin/elections'); // admin route
      setList(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    load(); 
    
    // Connect to WebSocket
    socketManager.connect();
    socketManager.joinAdmin();

    // Listen for real-time updates
    const handleElectionUpdated = (data) => {
      // Update elections list based on the action
      setList(prev => prev.map(election => {
        if (election._id === data.electionId) {
          switch (data.action) {
            case 'vote-cast':
              return { ...election, voteCount: (election.voteCount || 0) + 1 };
            case 'results-released':
              return { ...election, resultsReleased: true };
            case 'suspended':
              return { ...election, status: 'suspended' };
            case 'resumed':
              return { ...election, status: 'active' };
            default:
              return election;
          }
        }
        return election;
      }));
    };

    // Set up event listener
    socketManager.on('election-updated', handleElectionUpdated);

    // Cleanup function
    return () => {
      socketManager.off('election-updated', handleElectionUpdated);
    };
  }, []);

  const addAgeGroup = () => setForm(prev => ({ ...prev, ageGroups: [...prev.ageGroups, { min: '', max: '' }] }));
  const removeAgeGroup = idx => setForm(prev => ({ ...prev, ageGroups: prev.ageGroups.filter((_, i) => i !== idx) }));
  const updateAgeGroup = (idx, key, value) => {
    setForm(prev => {
      const newGroups = [...prev.ageGroups];
      newGroups[idx][key] = value;
      return { ...prev, ageGroups: newGroups };
    });
  };

  // Create election
  const createElection = async () => {
    try {
      const payload = {
        title: form.title.trim(),
        candidates: form.candidatesCSV,
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
        eligibleAgeGroups: form.ageGroups.map(g => ({ min: Number(g.min), max: Number(g.max) }))
      };
      await api.post('/admin/elections', payload); // admin route
      setMsg('Election created');
      setForm({ title: '', candidatesCSV: '', startTime: '', endTime: '', ageGroups: [] });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error');
    }
  };

  // Extend election
  const extendElection = async () => {
    if (!extendDate || !extendPopup.id) return;
    try {
      const isoDate = new Date(extendDate).toISOString();
      const { data } = await api.patch(`/admin/elections/${extendPopup.id}/extend`, { newEndDate: isoDate }); // admin route
      setMsg(data.message);
      setExtendPopup({ open: false, id: null });
      setExtendDate('');
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error extending election');
    }
  };

  // Suspend election
  const suspendElection = async () => {
    if (!suspendPopup.id) return;
    try {
      const { data } = await api.patch(`/admin/elections/${suspendPopup.id}/suspend`); // admin route
      setMsg(data.message);
      setSuspendPopup({ open: false, id: null });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error suspending election');
    }
  };

  // Resume election
  const resumeElection = async (id, newEndDate = null) => {
    try {
      let payload = {};
      if (newEndDate) payload.newEndDate = new Date(newEndDate).toISOString();
      const { data } = await api.patch(`/admin/elections/${id}/resume`, payload); // admin route
      setMsg(data.message);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error resuming election');
    }
  };

  // Delete election
  const deleteElection = async () => {
    if (!deletePopup.id) return;
    try {
      await api.delete(`/admin/elections/${deletePopup.id}`); // admin route
      setMsg('Election deleted successfully');
      setDeletePopup({ open: false, id: null, title: '' });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error deleting election');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'suspended': return '🟡';
      case 'closed': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🗳️ Manage Elections</h1>
        <p style={styles.subtitle}>Create and manage election campaigns</p>
      </div>

      {/* Create Election Form */}
      <div style={styles.formCard}>
        <h2 style={styles.formTitle}>Create New Election</h2>
        <div style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Election Title</label>
            <input 
              placeholder="Enter election title" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              style={styles.input} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Candidates</label>
            <input 
              placeholder="Enter candidates separated by commas" 
              value={form.candidatesCSV} 
              onChange={e => setForm({ ...form, candidatesCSV: e.target.value })} 
              style={styles.input} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Start Time</label>
            <input 
              type="datetime-local" 
              value={form.startTime} 
              onChange={e => setForm({ ...form, startTime: e.target.value })} 
              style={styles.input} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>End Time</label>
            <input 
              type="datetime-local" 
              value={form.endTime} 
              onChange={e => setForm({ ...form, endTime: e.target.value })} 
              style={styles.input} 
            />
          </div>
        </div>

        {/* Age Groups Section */}
        <div style={styles.ageGroupsSection}>
          <h3 style={styles.ageGroupsTitle}>Eligible Age Groups</h3>
          {form.ageGroups.map((g, idx) => (
            <div key={idx} style={styles.ageGroupRow}>
              <input 
                type="number" 
                placeholder="Min Age" 
                value={g.min} 
                onChange={e => updateAgeGroup(idx, 'min', e.target.value)} 
                style={styles.ageInput} 
              />
              <span style={styles.ageSeparator}>to</span>
              <input 
                type="number" 
                placeholder="Max Age" 
                value={g.max} 
                onChange={e => updateAgeGroup(idx, 'max', e.target.value)} 
                style={styles.ageInput} 
              />
              <button 
                type="button" 
                onClick={() => removeAgeGroup(idx)} 
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addAgeGroup} 
            style={styles.addAgeButton}
          >
            ➕ Add Age Group
          </button>
        </div>

        <button 
          onClick={createElection} 
          style={styles.createButton}
        >
          🚀 Create Election
        </button>
        
        {msg && (
          <div style={styles.message}>
            {msg}
          </div>
        )}
      </div>

      {/* Elections List */}
      <div style={styles.electionsCard}>
        <h2 style={styles.electionsTitle}>All Elections ({list.length})</h2>
        
        {list.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <h3>No Elections Found</h3>
            <p>Create your first election to get started!</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>Election</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Duration</th>
                  <th style={styles.tableHeaderCell}>Age Groups</th>
                  <th style={styles.tableHeaderCell}>Primary Actions</th>
                  <th style={styles.tableHeaderCell}>Secondary Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(e => (
                  <tr key={e._id} style={styles.tableRow} onClick={() => navigate(`/admin/elections/${e._id}`)}>
                    <td style={styles.tableCell}>
                      <div style={styles.electionInfo}>
                        <h4 style={styles.electionTitle}>{e.title}</h4>
                        <p style={styles.electionDates}>
                          {new Date(e.startTime).toLocaleDateString()} - {new Date(e.endTime).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(e.status)
                      }}>
                        <span style={styles.statusIcon}>{getStatusIcon(e.status)}</span>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.durationInfo}>
                        <div style={styles.durationItem}>
                          <span style={styles.durationLabel}>Start:</span>
                          <span style={styles.durationValue}>
                            {new Date(e.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.durationItem}>
                          <span style={styles.durationLabel}>End:</span>
                          <span style={styles.durationValue}>
                            {new Date(e.endTime).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.ageGroupsDisplay}>
                        {e.eligibleAgeGroups?.length > 0 ? 
                          e.eligibleAgeGroups.map((g, idx) => (
                            <span key={idx} style={styles.ageGroupTag}>
                              {g.min}-{g.max}
                            </span>
                          )) : 
                          <span style={styles.noAgeGroups}>No restrictions</span>
                        }
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.primaryActions}>
                        {e.status === 'active' ? (
                          <button 
                            onClick={ev => { ev.stopPropagation(); setSuspendPopup({ open: true, id: e._id }); }} 
                            style={styles.suspendButton}
                          >
                            ⏸️ Suspend
                          </button>
                        ) : e.status === 'suspended' ? (
                          <button 
                            onClick={ev => { ev.stopPropagation(); resumeElection(e._id); }} 
                            style={styles.resumeButton}
                          >
                            ▶️ Resume
                          </button>
                        ) : (
                          <span style={styles.noAction}>No actions available</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.secondaryActions}>
                        <button 
                          onClick={ev => { ev.stopPropagation(); setExtendPopup({ open: true, id: e._id }); }} 
                          style={styles.extendButton}
                        >
                          ⏰ Extend
                        </button>
                        <button 
                          onClick={ev => { ev.stopPropagation(); setDeletePopup({ open: true, id: e._id, title: e.title }); }} 
                          style={styles.deleteButton}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extend Popup */}
      {extendPopup.open && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={styles.popupTitle}>⏰ Extend Election</h3>
            <p style={styles.popupText}>Select a new end time for this election:</p>
            <input 
              type="datetime-local" 
              value={extendDate} 
              onChange={e => setExtendDate(e.target.value)} 
              style={styles.popupInput} 
            />
            <div style={styles.popupActions}>
              <button onClick={extendElection} style={styles.confirmButton}>
                ✅ Extend Election
              </button>
              <button 
                onClick={() => setExtendPopup({ open: false, id: null })} 
                style={styles.cancelButton}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Popup */}
      {suspendPopup.open && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={styles.popupTitle}>⏸️ Suspend Election</h3>
            <p style={styles.popupText}>Are you sure you want to suspend this election?</p>
            <p style={styles.popupWarning}>Voting will be temporarily disabled until resumed.</p>
            <div style={styles.popupActions}>
              <button onClick={suspendElection} style={styles.warningButton}>
                ⏸️ Suspend Election
              </button>
              <button 
                onClick={() => setSuspendPopup({ open: false, id: null })} 
                style={styles.cancelButton}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {deletePopup.open && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={styles.dangerTitle}>🗑️ Delete Election</h3>
            <p style={styles.popupText}>
              Are you sure you want to delete <strong>"{deletePopup.title}"</strong>?
            </p>
            <p style={styles.dangerWarning}>
              ⚠️ This action cannot be undone. All votes and data associated with this election will be permanently removed.
            </p>
            <div style={styles.popupActions}>
              <button onClick={deleteElection} style={styles.dangerButton}>
                🗑️ Delete Permanently
              </button>
              <button 
                onClick={() => setDeletePopup({ open: false, id: null, title: '' })} 
                style={styles.cancelButton}
              >
                ❌ Cancel
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
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },

  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  subtitle: {
    fontSize: '1.125rem',
    color: '#64748b',
    margin: 0
  },

  formCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    marginBottom: '32px'
  },

  formTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },

  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#1e293b',
    transition: 'all 0.3s ease',
    outline: 'none'
  },

  ageGroupsSection: {
    marginBottom: '24px'
  },

  ageGroupsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },

  ageGroupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },

  ageInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '14px',
    width: '100px',
    textAlign: 'center'
  },

  ageSeparator: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500'
  },

  removeButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  },

  addAgeButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  createButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    width: '100%'
  },

  message: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: '14px',
    fontWeight: '500'
  },

  electionsCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  electionsTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 24px 0'
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    color: '#64748b'
  },

  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    display: 'block'
  },

  tableContainer: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white'
  },

  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },

  tableHeaderCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e2e8f0'
  },

  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  tableCell: {
    padding: '16px',
    verticalAlign: 'top'
  },

  electionInfo: {
    minWidth: '200px'
  },

  electionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },

  electionDates: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  statusIcon: {
    fontSize: '12px'
  },

  durationInfo: {
    fontSize: '12px',
    color: '#64748b'
  },

  durationItem: {
    marginBottom: '4px'
  },

  durationLabel: {
    fontWeight: '500',
    color: '#374151'
  },

  durationValue: {
    marginLeft: '8px'
  },

  ageGroupsDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },

  ageGroupTag: {
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
  },

  noAgeGroups: {
    color: '#9ca3af',
    fontSize: '12px',
    fontStyle: 'italic'
  },

  primaryActions: {
    display: 'flex',
    gap: '8px'
  },

  secondaryActions: {
    display: 'flex',
    gap: '8px'
  },

  suspendButton: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  resumeButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  extendButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  deleteButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  noAction: {
    color: '#9ca3af',
    fontSize: '12px',
    fontStyle: 'italic'
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },

  popup: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center'
  },

  popupTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },

  dangerTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 16px 0'
  },

  popupText: {
    fontSize: '1rem',
    color: '#374151',
    margin: '0 0 16px 0'
  },

  popupWarning: {
    fontSize: '14px',
    color: '#f59e0b',
    margin: '0 0 24px 0',
    fontStyle: 'italic'
  },

  dangerWarning: {
    fontSize: '14px',
    color: '#dc2626',
    margin: '0 0 24px 0',
    fontStyle: 'italic',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },

  popupInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    marginBottom: '24px',
    outline: 'none'
  },

  popupActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },

  confirmButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },

  warningButton: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },

  dangerButton: {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },

  cancelButton: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
  
  .tableRow:hover {
    background-color: #f8fafc !important;
    transform: translateY(-1px);
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
  
  .createButton:hover {
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5) !important;
  }
  
  .suspendButton:hover {
    background-color: #d97706 !important;
  }
  
  .resumeButton:hover {
    background-color: #059669 !important;
  }
  
  .extendButton:hover {
    background-color: #2563eb !important;
  }
  
  .deleteButton:hover {
    background-color: #dc2626 !important;
  }
  
  .removeButton:hover {
    background-color: #dc2626 !important;
  }
  
  .addAgeButton:hover {
    background-color: #4b5563 !important;
  }
  
  .confirmButton:hover {
    background-color: #059669 !important;
  }
  
  .warningButton:hover {
    background-color: #d97706 !important;
  }
  
  .dangerButton:hover {
    background-color: #b91c1c !important;
  }
  
  .cancelButton:hover {
    background-color: #4b5563 !important;
  }
`;
document.head.appendChild(styleSheet);
