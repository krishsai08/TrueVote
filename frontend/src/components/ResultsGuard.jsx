import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResultsAccess } from '../hooks/useResultsAccess';

export default function ResultsGuard({ children }) {
  const { id } = useParams();
  const { canAccess, loading, error } = useResultsAccess(id);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Checking results access...</p>
      </div>
    );
  }

  if (error || canAccess === false) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>🔒</span>
        <h2 style={styles.errorTitle}>Access Denied</h2>
        <p style={styles.errorText}>
          {error || 'Results for this election have not been released yet.'}
        </p>
        <p style={styles.errorSubtext}>
          Please wait for the administrator to release the results before viewing them.
        </p>
        <Link to="/dashboard" style={styles.backButton}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return children;
}

const styles = {
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
    textAlign: 'center',
    padding: '20px'
  },

  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },

  errorTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 16px 0'
  },

  errorText: {
    fontSize: '1.125rem',
    color: '#374151',
    margin: '0 0 12px 0',
    maxWidth: '500px'
  },

  errorSubtext: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 32px 0',
    maxWidth: '500px'
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
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .backButton:hover {
    background-color: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;
document.head.appendChild(styleSheet);
