import React, { useState, useEffect } from 'react';
import api from '../api/client';
import AnnouncementCard from './AnnouncementCard';

export default function AnnouncementsSection({ userRole }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/announcements/public');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorCard}>
        <span style={styles.errorIcon}>⚠️</span>
        {error}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div style={styles.emptyState}>
        <span style={styles.emptyIcon}>📭</span>
        <h3 style={styles.emptyTitle}>No Announcements</h3>
        <p style={styles.emptyText}>
          {userRole === 'admin' 
            ? 'Create your first announcement to keep users informed'
            : 'Check back later for important updates and announcements'
          }
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.announcementsContainer}>
        {announcements.map((announcement) => (
          <div key={announcement._id} style={styles.announcementWrapper}>
            <AnnouncementCard
              announcement={announcement}
              isAdmin={false}
            />
          </div>
        ))}
      </div>
      
      {announcements.length > 3 && (
        <div style={styles.scrollIndicator}>
          <span style={styles.scrollIcon}>⬇️</span>
          <span style={styles.scrollText}>Scroll to see more announcements</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative'
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#64748b'
  },

  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },

  loadingText: {
    fontSize: '1rem',
    margin: 0
  },

  errorCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  errorIcon: {
    fontSize: '20px'
  },

  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b'
  },

  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },

  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 8px 0'
  },

  emptyText: {
    fontSize: '1rem',
    margin: 0,
    lineHeight: '1.5'
  },

  announcementsContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
    paddingRight: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9'
  },

  announcementWrapper: {
    marginBottom: '16px'
  },

  scrollIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    marginTop: '16px',
    color: '#64748b',
    fontSize: '14px'
  },

  scrollIcon: {
    fontSize: '16px',
    animation: 'bounce 2s infinite'
  },

  scrollText: {
    fontWeight: '500'
  }
};

// Add CSS animations and scrollbar styling
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
  
  .announcementsContainer::-webkit-scrollbar {
    width: 6px;
  }
  
  .announcementsContainer::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .announcementsContainer::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .announcementsContainer::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
document.head.appendChild(styleSheet); 