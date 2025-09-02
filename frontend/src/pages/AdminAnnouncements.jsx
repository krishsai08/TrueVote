import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementForm from '../components/AnnouncementForm';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      await api.post('/announcements', formData);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to create announcement');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await api.put(`/announcements/${editingAnnouncement._id}`, formData);
      setEditingAnnouncement(null);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to update announcement');
    }
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/announcements/${announcementId}`);
        fetchAnnouncements();
      } catch (err) {
        setError('Failed to delete announcement');
      }
    }
  };

  const handleToggle = async (announcementId) => {
    try {
      await api.patch(`/announcements/${announcementId}/toggle`);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to toggle announcement status');
    }
  };

  const handleEditClick = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'all') return true;
    if (filter === 'active') return announcement.isActive;
    if (filter === 'inactive') return !announcement.isActive;
    return announcement.priority === filter;
  });

  const getFilterCount = (filterType) => {
    if (filterType === 'all') return announcements.length;
    if (filterType === 'active') return announcements.filter(a => a.isActive).length;
    if (filterType === 'inactive') return announcements.filter(a => !a.isActive).length;
    return announcements.filter(a => a.priority === filterType).length;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/dashboard" style={styles.backLink}>
          <span style={styles.backIcon}>←</span>
          Back to Dashboard
        </Link>
        <h1 style={styles.title}>Announcement Management</h1>
        <p style={styles.subtitle}>Create and manage system announcements</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📢</span>
          <div>
            <div style={styles.statNumber}>{announcements.length}</div>
            <div style={styles.statLabel}>Total Announcements</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <div style={styles.statNumber}>
              {announcements.filter(a => a.isActive).length}
            </div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🚨</span>
          <div>
            <div style={styles.statNumber}>
              {announcements.filter(a => a.priority === 'urgent').length}
            </div>
            <div style={styles.statLabel}>Urgent</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>⏰</span>
          <div>
            <div style={styles.statNumber}>
              {announcements.filter(a => a.expiresAt && new Date(a.expiresAt) < new Date()).length}
            </div>
            <div style={styles.statLabel}>Expired</div>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div style={styles.controlsSection}>
        <div style={styles.controlsLeft}>
          <button 
            style={styles.createButton}
            onClick={() => setShowForm(true)}
          >
            <span style={styles.createIcon}>➕</span>
            Create Announcement
          </button>
        </div>
        
        <div style={styles.controlsRight}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All ({getFilterCount('all')})</option>
            <option value="active">Active ({getFilterCount('active')})</option>
            <option value="inactive">Inactive ({getFilterCount('inactive')})</option>
            <option value="urgent">Urgent ({getFilterCount('urgent')})</option>
            <option value="high">High ({getFilterCount('high')})</option>
            <option value="medium">Medium ({getFilterCount('medium')})</option>
            <option value="low">Low ({getFilterCount('low')})</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <h3 style={styles.emptyTitle}>No Announcements Found</h3>
          <p style={styles.emptyText}>
            {filter === 'all' 
              ? 'Create your first announcement to get started'
              : `No announcements match the "${filter}" filter`
            }
          </p>
          {filter !== 'all' && (
            <button 
              style={styles.clearFilterButton}
              onClick={() => setFilter('all')}
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div style={styles.announcementsGrid}>
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              isAdmin={true}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={editingAnnouncement ? handleEdit : handleCreate}
          onCancel={handleCancel}
        />
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

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  },

  statIcon: {
    fontSize: '32px'
  },

  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1'
  },

  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px'
  },

  controlsSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },

  controlsLeft: {
    display: 'flex',
    gap: '16px'
  },

  controlsRight: {
    display: 'flex',
    gap: '16px'
  },

  createButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },

  createIcon: {
    fontSize: '16px'
  },

  filterSelect: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#1e293b',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
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
    margin: '0 0 20px 0',
    lineHeight: '1.5',
    color: '#64748b'
  },

  clearFilterButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  announcementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '24px'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .createButton:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  
  .filterSelect:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .clearFilterButton:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
  
  .statCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;
document.head.appendChild(styleSheet); 