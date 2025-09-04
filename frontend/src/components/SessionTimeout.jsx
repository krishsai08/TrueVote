import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SessionTimeout() {
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return;

    const sessionDuration = 30 * 60 * 1000; // 30 minutes
    const warningTime = 5 * 60 * 1000; // 5 minutes before expiry

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - parseInt(loginTime);
      const remaining = sessionDuration - elapsed;

      if (remaining <= 0) {
        logout();
        return;
      }

      if (remaining <= warningTime) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000)); // Convert to seconds
      } else {
        setShowWarning(false);
        setTimeLeft(null);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [user, logout]);

  const handleExtendSession = () => {
    // Reset the login time to extend the session
    localStorage.setItem('loginTime', Date.now().toString());
    setShowWarning(false);
    setTimeLeft(null);
  };

  const handleLogout = () => {
    logout();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning || !timeLeft) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.icon}>⏰</span>
          <h3 style={styles.title}>Session Timeout Warning</h3>
        </div>
        
        <div style={styles.content}>
          <p style={styles.message}>
            Your session will expire in <strong style={styles.timeLeft}>{formatTime(timeLeft)}</strong>
          </p>
          <p style={styles.subMessage}>
            Click "Extend Session" to continue working, or "Logout" to end your session now.
          </p>
        </div>

        <div style={styles.actions}>
          <button 
            onClick={handleExtendSession}
            style={styles.extendButton}
          >
            <span style={styles.buttonIcon}>⏱️</span>
            Extend Session
          </button>
          <button 
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <span style={styles.buttonIcon}>🚪</span>
            Logout
          </button>
        </div>

        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${(timeLeft / (5 * 60)) * 100}%` // 5 minutes = 300 seconds
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  },

  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    animation: 'slideIn 0.3s ease-out'
  },

  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },

  icon: {
    fontSize: '48px',
    marginBottom: '12px',
    display: 'block'
  },

  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },

  content: {
    textAlign: 'center',
    marginBottom: '32px'
  },

  message: {
    fontSize: '18px',
    color: '#374151',
    margin: '0 0 12px 0',
    lineHeight: '1.5'
  },

  subMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.4'
  },

  timeLeft: {
    color: '#ef4444',
    fontWeight: '700'
  },

  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '24px'
  },

  extendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
  },

  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
  },

  buttonIcon: {
    fontSize: '16px'
  },

  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: '3px',
    transition: 'width 1s linear'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .extendButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
  }
  
  .logoutButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
  }
`;
document.head.appendChild(styleSheet);
