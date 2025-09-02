import React from 'react';

export default function AnnouncementCard({ announcement, isAdmin = false, onEdit, onDelete, onToggle }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📢';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.prioritySection}>
          <span style={styles.priorityIcon}>{getPriorityIcon(announcement.priority)}</span>
          <div style={{ ...styles.priorityBadge, backgroundColor: getPriorityColor(announcement.priority) }}>
            {announcement.priority}
          </div>
        </div>
        <div style={styles.metaInfo}>
          <span style={styles.author}>by {announcement.author?.name || 'Admin'}</span>
          <span style={styles.date}>{formatDate(announcement.createdAt)}</span>
        </div>
      </div>
      
      <h3 style={styles.title}>{announcement.title}</h3>
      <p style={styles.content}>{announcement.content}</p>
      
      {announcement.expiresAt && (
        <div style={styles.expiryInfo}>
          <span style={styles.expiryIcon}>⏰</span>
          <span style={styles.expiryText}>
            Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {isAdmin && (
        <div style={styles.adminActions}>
          <button 
            style={{
              ...styles.actionButton,
              backgroundColor: announcement.isActive ? '#ef4444' : '#10b981'
            }}
            onClick={() => onToggle(announcement._id)}
          >
            {announcement.isActive ? '🔄 Deactivate' : '✅ Activate'}
          </button>
          <button 
            style={{ ...styles.actionButton, backgroundColor: '#3b82f6' }}
            onClick={() => onEdit(announcement)}
          >
            ✏️ Edit
          </button>
          <button 
            style={{ ...styles.actionButton, backgroundColor: '#ef4444' }}
            onClick={() => onDelete(announcement._id)}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },

  prioritySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  priorityIcon: {
    fontSize: '20px'
  },

  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },

  author: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500'
  },

  date: {
    fontSize: '11px',
    color: '#94a3b8'
  },

  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0',
    lineHeight: '1.4'
  },

  content: {
    fontSize: '1rem',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 16px 0'
  },

  expiryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    marginBottom: '16px'
  },

  expiryIcon: {
    fontSize: '16px'
  },

  expiryText: {
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '500'
  },

  adminActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },

  actionButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .announcementCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
  
  .actionButton:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
`;
document.head.appendChild(styleSheet); 