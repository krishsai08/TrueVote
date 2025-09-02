// Updated Dashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketManager from '../utils/socket.js';
import AnnouncementsSection from '../components/AnnouncementsSection';

export default function Dashboard() {
  const [elections, setElections] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUserData(data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    })();
  }, [user]);

  // Fetch elections
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const endpoint = user.role === 'admin' ? '/admin/elections' : '/elections/user/list';
        const { data } = await api.get(endpoint);
        setElections(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  // Fetch user's votes (only for regular users)
  useEffect(() => {
    if (!user || user.role !== 'user') return;
    (async () => {
      try {
        const { data } = await api.get('/votes/user/my-votes');
        setMyVotes(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  // WebSocket setup
  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    socketManager.connect();

    // Join appropriate room based on user role
    if (user.role === 'admin') {
      socketManager.joinAdmin();
    } else if (userData?.id) {
      socketManager.joinUser(userData.id);
    }

    // Listen for real-time updates
    const handleElectionUpdated = (data) => {
      // Update elections list based on the action
      setElections(prev => prev.map(election => {
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

    const handleVoteConfirmed = (data) => {
      if (user.role === 'user') {
        // Refresh user's votes
        (async () => {
          try {
            const { data: votesData } = await api.get('/votes/user/my-votes');
            setMyVotes(votesData);
          } catch (err) {
            console.error('Failed to refresh votes:', err);
          }
        })();
      }
    };

    // Set up event listeners
    socketManager.on('election-updated', handleElectionUpdated);
    socketManager.on('vote-confirmed', handleVoteConfirmed);

    // Cleanup function
    return () => {
      socketManager.off('election-updated', handleElectionUpdated);
      socketManager.off('vote-confirmed', handleVoteConfirmed);
    };
  }, [user, userData]);

  const handleRowClick = (election) => {
    if (user.role === 'admin') {
      navigate(`/admin/elections/${election._id}`);
    } else {
      // For regular users, only allow navigation if results are released
      if (election.resultsReleased) {
        navigate(`/results/${election._id}`);
      } else {
        // Show a message that results are not yet released
        alert('Results for this election have not been released yet. Please wait for the administrator to release the results.');
      }
    }
  };

  const releaseResults = async (electionId) => {
    try {
      await api.patch(`/admin/elections/${electionId}/release-results`);
      setElections(prev =>
        prev.map(e => e._id === electionId ? { ...e, resultsReleased: true } : e)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteElection = (electionId, title) => {
    setDeleteConfirm({ show: true, id: electionId, title });
  };

  const confirmDeleteElection = async () => {
    try {
      await api.delete(`/admin/elections/${deleteConfirm.id}`);
      setElections(prev => prev.filter(e => e._id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null, title: '' });
    } catch (err) {
      console.error('Failed to delete election:', err);
    }
  };

  const isEligible = (eligibleAgeGroups) => {
    if (!eligibleAgeGroups || eligibleAgeGroups.length === 0) return true;
    if (!userData?.age) return false;
    return eligibleAgeGroups.some(group => userData.age >= group.min && userData.age <= group.max);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'ongoing': return '🟢';
      case 'active': return '🟢';
      case 'closed': return '🔴';
      case 'suspended': return '⏸️';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'ongoing': return '#10b981';
      case 'active': return '#10b981';
      case 'closed': return '#ef4444';
      case 'suspended': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              Welcome back, <span style={styles.userName}>{user?.name}</span>! 👋
            </h1>
            <p style={styles.heroSubtitle}>
              {user.role === 'admin' 
                ? 'Manage elections and monitor voting progress from your admin dashboard'
                : 'Participate in democratic elections and make your voice heard'
              }
            </p>
            <div style={styles.userStats}>
              <div style={styles.statCard}>
                <span style={styles.statIcon}>🗳️</span>
                <div>
                  <div style={styles.statNumber}>{elections.length}</div>
                  <div style={styles.statLabel}>Total Elections</div>
                </div>
              </div>
              {user.role === 'user' && (
                <div style={styles.statCard}>
                  <span style={styles.statIcon}>✅</span>
                  <div>
                    <div style={styles.statNumber}>{myVotes.length}</div>
                    <div style={styles.statLabel}>Votes Cast</div>
                  </div>
                </div>
              )}
              <div style={styles.statCard}>
                <span style={styles.statIcon}>👤</span>
                <div>
                  <div style={styles.statNumber}>{userData?.age || 'N/A'}</div>
                  <div style={styles.statLabel}>Age</div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.heroImage}>
            <div style={styles.imagePlaceholder}>
              <span style={styles.imageIcon}>🏛️</span>
              <p style={styles.imageText}>Democracy in Action</p>
            </div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>
          <span style={styles.logoutIcon}>🚪</span>
          Logout
        </button>
      </div>

      {/* Elections Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrapper}>
            <span style={styles.sectionIcon}>📊</span>
            <h2 style={styles.sectionTitle}>
              {user.role === 'admin' ? 'Election Management' : 'Available Elections'}
            </h2>
          </div>
          <p style={styles.sectionDescription}>
            {user.role === 'admin' 
              ? 'Monitor and manage all elections in the system'
              : 'Participate in elections you are eligible for'
            }
          </p>
        </div>

        {elections.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <h3 style={styles.emptyTitle}>No Elections Available</h3>
            <p style={styles.emptyText}>
              {user.role === 'admin' 
                ? 'Create your first election to get started'
                : 'Check back later for upcoming elections'
              }
            </p>
          </div>
        ) : (
          <div style={styles.electionsGrid}>
            {elections.map((election) => {
              const eligible = isEligible(election.eligibleAgeGroups);
              return (
                <div 
                  key={election._id} 
                  style={styles.electionCard}
                  onClick={() => handleRowClick(election)}
                >
                  <div style={styles.electionHeader}>
                    <h3 style={styles.electionTitle}>{election.title}</h3>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(election.status)
                    }}>
                      <span style={styles.statusIcon}>{getStatusIcon(election.status)}</span>
                      {election.status}
                    </div>
                  </div>
                  
                  <div style={styles.electionDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>📅</span>
                      <span style={styles.detailText}>
                        {new Date(election.startTime).toLocaleDateString()} - {new Date(election.endTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>👥</span>
                      <span style={styles.detailText}>
                        {election.candidates?.length || 0} Candidates
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>🎯</span>
                      <span style={styles.detailText}>
                        {eligible ? '✅ Eligible' : '❌ Not Eligible'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.electionActions}>
                    {user.role === 'user' && election.status === 'ongoing' && eligible && !election.resultsReleased && (
                      <Link 
                        style={styles.voteBtn} 
                        to={`/vote/${election._id}`} 
                        onClick={ev => ev.stopPropagation()}
                      >
                        <span style={styles.voteIcon}>🗳️</span>
                        Cast Vote
                      </Link>
                    )}
                    {user.role === 'admin' && !election.resultsReleased && (
                      <button 
                        style={styles.releaseBtn} 
                        onClick={ev => { ev.stopPropagation(); releaseResults(election._id); }}
                      >
                        <span style={styles.releaseIcon}>📢</span>
                        Release Results
                      </button>
                    )}
                    {user.role === 'admin' && election.resultsReleased && (
                      <span style={styles.releasedBadge}>📊 Results Released</span>
                    )}
                    {user.role === 'admin' && (
                      <button 
                        style={styles.deleteBtn} 
                        onClick={ev => { ev.stopPropagation(); handleDeleteElection(election._id, election.title); }}
                      >
                        <span style={styles.deleteIcon}>🗑️</span>
                        Delete
                      </button>
                    )}
                    {user.role === 'user' && (
                      election.resultsReleased ? (
                        <span style={styles.viewResultsBadge}>👁️ View Results</span>
                      ) : (
                        <span style={styles.waitingBadge}>⏳ Results Pending</span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Votes Section - Only for regular users */}
      {user.role === 'user' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitleWrapper}>
              <span style={styles.sectionIcon}>📝</span>
              <h2 style={styles.sectionTitle}>My Voting History</h2>
            </div>
            <p style={styles.sectionDescription}>
              Track all the elections you've participated in
            </p>
          </div>

          {myVotes.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📭</span>
              <h3 style={styles.emptyTitle}>No Votes Cast Yet</h3>
              <p style={styles.emptyText}>
                Participate in elections to see your voting history here
              </p>
            </div>
          ) : (
            <div style={styles.votesGrid}>
              {myVotes.map((vote, idx) => (
                <div key={idx} style={styles.voteCard}>
                  <div style={styles.voteHeader}>
                    <h4 style={styles.voteTitle}>{vote.election}</h4>
                    <span style={styles.voteTimestamp}>
                      {new Date(vote.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.voteDetails}>
                    <div style={styles.voteOption}>
                      <span style={styles.voteIcon}>✅</span>
                      <span style={styles.voteText}>Voted for: {vote.option}</span>
                    </div>
                    <div style={styles.voteTime}>
                      <span style={styles.timeIcon}>🕐</span>
                      <span style={styles.timeText}>
                        {new Date(vote.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrapper}>
            <span style={styles.sectionIcon}>📢</span>
            <h2 style={styles.sectionTitle}>Announcements</h2>
          </div>
          <p style={styles.sectionDescription}>
            Stay updated with the latest system announcements and important information
          </p>
          {user.role === 'admin' && (
            <button 
              style={styles.createAnnouncementBtn}
              onClick={() => navigate('/admin/announcements')}
            >
              <span style={styles.createIcon}>➕</span>
              Manage Announcements
            </button>
          )}
        </div>

        <AnnouncementsSection userRole={user.role} />
      </div>

      {/* Quick Actions Section */}
      <div style={styles.quickActions}>
        <h3 style={styles.quickActionsTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionBtn} onClick={() => navigate('/profile')}>
            <span style={styles.actionIcon}>👤</span>
            <span style={styles.actionText}>Update Profile</span>
          </button>
          {user.role === 'admin' && (
            <>
              <button style={styles.actionBtn} onClick={() => navigate('/admin/elections')}>
                <span style={styles.actionIcon}>⚙️</span>
                <span style={styles.actionText}>Manage Elections</span>
              </button>
              <button style={styles.actionBtn} onClick={() => navigate('/admin/results')}>
                <span style={styles.actionIcon}>📊</span>
                <span style={styles.actionText}>View Results</span>
              </button>
              <button style={styles.actionBtn} onClick={() => navigate('/admin/fraud-logs')}>
                <span style={styles.actionIcon}>🚨</span>
                <span style={styles.actionText}>Fraud Logs</span>
              </button>
              <button style={styles.actionBtn} onClick={() => navigate('/admin/announcements')}>
                <span style={styles.actionIcon}>📢</span>
                <span style={styles.actionText}>Announcements</span>
              </button>
            </>
          )}
          <button style={styles.actionBtn} onClick={() => window.location.reload()}>
            <span style={styles.actionIcon}>🔄</span>
            <span style={styles.actionText}>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirm.show && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={styles.popupTitle}>⚠️ Delete Election</h3>
            <p style={styles.popupText}>
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
            </p>
            <p style={styles.popupWarning}>
              This action cannot be undone. All votes and data associated with this election will be permanently removed.
            </p>
            <div style={styles.popupActions}>
              <button style={styles.confirmDeleteBtn} onClick={confirmDeleteElection}>
                Delete Permanently
              </button>
              <button style={styles.cancelBtn} onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modern, beautiful styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },

  // Hero Section
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '40px',
    marginBottom: '32px',
    position: 'relative',
    overflow: 'hidden',
    color: 'white'
  },

  heroContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '40px'
  },

  heroText: {
    flex: 1
  },

  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: '0 0 16px 0',
    lineHeight: '1.2'
  },

  userName: {
    background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: 'none'
  },

  heroSubtitle: {
    fontSize: '1.1rem',
    margin: '0 0 24px 0',
    opacity: 0.9,
    lineHeight: '1.6'
  },

  userStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '16px 20px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  statIcon: {
    fontSize: '24px'
  },

  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    lineHeight: '1'
  },

  statLabel: {
    fontSize: '0.875rem',
    opacity: 0.8,
    marginTop: '4px'
  },

  heroImage: {
    flex: '0 0 200px'
  },

  imagePlaceholder: {
    width: '200px',
    height: '200px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  imageIcon: {
    fontSize: '64px',
    marginBottom: '12px'
  },

  imageText: {
    fontSize: '14px',
    textAlign: 'center',
    opacity: 0.8,
    margin: 0
  },

  logoutBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  },

  logoutIcon: {
    fontSize: '16px'
  },

  // Section Styles
  section: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  sectionHeader: {
    marginBottom: '24px'
  },

  sectionTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },

  sectionIcon: {
    fontSize: '24px'
  },

  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  sectionDescription: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5'
  },

  createAnnouncementBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    marginLeft: 'auto'
  },

  createIcon: {
    fontSize: '16px'
  },

  // Elections Grid
  electionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },

  electionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },

  electionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },

  electionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    marginRight: '12px'
  },

  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    whiteSpace: 'nowrap'
  },

  statusIcon: {
    fontSize: '14px'
  },

  electionDetails: {
    marginBottom: '20px'
  },

  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '0.875rem',
    color: '#64748b'
  },

  detailIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center'
  },

  detailText: {
    flex: 1
  },

  electionActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },

  voteBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s ease'
  },

  

  releaseBtn: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s ease'
  },

  releaseIcon: {
    fontSize: '16px'
  },

  releasedBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },

  viewResultsBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },

  waitingBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },

  // Votes Grid
  votesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },

  voteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },

  voteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  voteTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    flex: 1
  },

  voteTimestamp: {
    fontSize: '0.875rem',
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    padding: '4px 8px',
    borderRadius: '6px'
  },

  voteDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  voteOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#374151'
  },

  voteIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center'
  },

  voteText: {
    flex: 1
  },

  voteTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#6b7280'
  },

  timeIcon: {
    fontSize: '14px',
    width: '16px',
    textAlign: 'center'
  },

  timeText: {
    flex: 1
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
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
    lineHeight: '1.5'
  },

  // Quick Actions
  quickActions: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  quickActionsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0'
  },

  actionsGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },

  actionBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '16px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    minWidth: '140px',
    justifyContent: 'center'
  },

  actionIcon: {
    fontSize: '18px'
  },

  actionText: {
    fontSize: '0.875rem'
  },

  deleteBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s ease'
  },

  deleteIcon: {
    fontSize: '16px'
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
    zIndex: 1000
  },

  popup: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center'
  },

  popupTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#dc3545',
    margin: '0 0 16px 0'
  },

  popupText: {
    fontSize: '1rem',
    color: '#374151',
    margin: '0 0 12px 0'
  },

  popupWarning: {
    fontSize: '0.875rem',
    color: '#dc3545',
    fontStyle: 'italic',
    margin: '0 0 20px 0'
  },

  popupActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },

  confirmDeleteBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  cancelBtn: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .electionCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
  
  .voteCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  }
  
  .actionBtn:hover {
    background-color: #e2e8f0;
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }
  
  .voteBtn:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  
  .releaseBtn:hover {
    background-color: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
  }
  
  .logoutBtn:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .statCard:hover {
    transform: translateY(-2px);
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  .createAnnouncementBtn:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  
  .deleteBtn:hover {
    background-color: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
  }
  
  .confirmDeleteBtn:hover {
    background-color: #c82333;
    transform: translateY(-1px);
  }
  
  .cancelBtn:hover {
    background-color: #5a6268;
    transform: translateY(-1px);
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .section {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .electionCard:nth-child(1) { animation-delay: 0.1s; }
  .electionCard:nth-child(2) { animation-delay: 0.2s; }
  .electionCard:nth-child(3) { animation-delay: 0.3s; }
  .electionCard:nth-child(4) { animation-delay: 0.4s; }
`;
document.head.appendChild(styleSheet);
