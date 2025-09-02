import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function OTPVerification({ 
  electionId, 
  electionTitle, 
  onVerificationSuccess, 
  onCancel,
  userEmail 
}) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const generateOTP = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/otp/generate', { electionId });
      setMessage(response.data.message);
      setMessageType('success');
      setOtpSent(true);
      setCountdown(300); // 5 minutes countdown
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/otp/resend', { electionId });
      setMessage(response.data.message);
      setMessageType('success');
      setCountdown(300); // 5 minutes countdown
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend OTP');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/otp/verify', { electionId, otp });
      setMessage(response.data.message);
      setMessageType('success');
      
      // Call the success callback with verification token
      onVerificationSuccess(response.data.verificationToken);
    } catch (error) {
      setMessage(error.response?.data?.message || 'OTP verification failed');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔐 OTP Verification Required</h2>
        <p style={styles.subtitle}>
          To cast your vote in <strong>"{electionTitle}"</strong>, please verify your identity with the OTP sent to:
        </p>
        <div style={styles.emailDisplay}>
          <span style={styles.emailIcon}>📧</span>
          <span style={styles.emailText}>{userEmail}</span>
        </div>
      </div>

      {!otpSent ? (
        <div style={styles.otpSection}>
          <p style={styles.instruction}>
            Click the button below to receive a One-Time Password (OTP) via email.
          </p>
          <button
            style={styles.generateButton}
            onClick={generateOTP}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Sending...' : '📧 Send OTP'}
          </button>
        </div>
      ) : (
        <div style={styles.otpSection}>
          <div style={styles.timerContainer}>
            <span style={styles.timerIcon}>⏰</span>
            <span style={styles.timerText}>
              OTP expires in: <strong>{formatTime(countdown)}</strong>
            </span>
          </div>

          <div style={styles.inputContainer}>
            <label style={styles.label}>Enter 6-digit OTP:</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={styles.otpInput}
              maxLength={6}
            />
          </div>

          <div style={styles.buttonContainer}>
            <button
              style={styles.verifyButton}
              onClick={verifyOTP}
              disabled={isLoading || !otp || otp.length !== 6}
            >
              {isLoading ? '⏳ Verifying...' : '✅ Verify OTP'}
            </button>
            
            {countdown === 0 && (
              <button
                style={styles.resendButton}
                onClick={resendOTP}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Sending...' : '🔄 Resend OTP'}
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: messageType === 'success' ? '#d1fae5' : 
                         messageType === 'error' ? '#fee2e2' : '#dbeafe',
          color: messageType === 'success' ? '#065f46' : 
                 messageType === 'error' ? '#991b1b' : '#1e40af',
          borderColor: messageType === 'success' ? '#10b981' : 
                      messageType === 'error' ? '#ef4444' : '#3b82f6'
        }}>
          <span style={styles.messageIcon}>
            {messageType === 'success' ? '✅' : 
             messageType === 'error' ? '❌' : 'ℹ️'}
          </span>
          {message}
        </div>
      )}

      <div style={styles.infoSection}>
        <h4 style={styles.infoTitle}>ℹ️ Important Information:</h4>
        <ul style={styles.infoList}>
          <li>OTP is valid for <strong>5 minutes only</strong></li>
          <li>Check your email inbox and spam folder</li>
          <li>Do not share this OTP with anyone</li>
          <li>Smart eVoting staff will never ask for your OTP</li>
        </ul>
      </div>

      <div style={styles.actionButtons}>
        <button
          style={styles.cancelButton}
          onClick={onCancel}
          disabled={isLoading}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto'
  },

  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },

  title: {
    color: '#1e293b',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },

  subtitle: {
    color: '#64748b',
    fontSize: '1rem',
    lineHeight: '1.5',
    margin: '0 0 16px 0'
  },

  emailDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  emailIcon: {
    fontSize: '18px'
  },

  emailText: {
    color: '#1e293b',
    fontWeight: '500',
    fontSize: '1rem'
  },

  otpSection: {
    marginBottom: '24px'
  },

  instruction: {
    color: '#64748b',
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '0 0 20px 0'
  },

  timerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#fef3c7',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #f59e0b',
    marginBottom: '20px'
  },

  timerIcon: {
    fontSize: '18px'
  },

  timerText: {
    color: '#92400e',
    fontSize: '0.875rem',
    fontWeight: '500'
  },

  inputContainer: {
    marginBottom: '20px'
  },

  label: {
    display: 'block',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '8px'
  },

  otpInput: {
    width: '100%',
    padding: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: '8px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontFamily: 'Courier New, monospace',
    backgroundColor: '#f8fafc'
  },

  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  generateButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%'
  },

  verifyButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%'
  },

  resendButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  message: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  messageIcon: {
    fontSize: '18px'
  },

  infoSection: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px'
  },

  infoTitle: {
    color: '#1e293b',
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },

  infoList: {
    color: '#64748b',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    margin: 0,
    paddingLeft: '20px'
  },

  actionButtons: {
    display: 'flex',
    justifyContent: 'center'
  },

  cancelButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
}; 