import React, { useState } from 'react';
import api from '../api/client';
import FaceCapture from '../components/FaceCapture';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    dateOfBirth: '', 
    occupation: '' 
  });
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!faceEmbedding) return setMsg('Please capture your face.');
    if (!form.dateOfBirth) return setMsg('Please select your date of birth.');
    
    setIsLoading(true);
    try {
      await api.post('/auth/register', { ...form, faceEmbedding });
      setMsg('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.backgroundShape1}></div>
        <div style={styles.backgroundShape2}></div>
        <div style={styles.backgroundShape3}></div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🗳️</span>
            <h1 style={styles.title}>eVoting System</h1>
          </div>
          <h2 style={styles.subtitle}>Create Your Account</h2>
          <p style={styles.description}>
            Join our secure voting platform and make your voice heard
          </p>
        </div>

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                style={styles.input}
                placeholder="Enter your full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                style={styles.input}
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                style={styles.input}
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <small style={styles.helpText}>Minimum 6 characters</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Date of Birth</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🎂</span>
              <input
                style={styles.input}
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Occupation (Optional)</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>💼</span>
              <input
                style={styles.input}
                placeholder="What do you do?"
                value={form.occupation}
                onChange={e => setForm({ ...form, occupation: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.faceCaptureSection}>
            <label style={styles.label}>Face Verification</label>
            <div style={styles.faceCaptureWrapper}>
              <FaceCapture
                onEmbedding={setFaceEmbedding}
                buttonText={faceEmbedding ? '✅ Face Captured' : '📷 Capture Face'}
              />
            </div>
            <small style={styles.helpText}>
              This ensures secure voting and prevents fraud
            </small>
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.submitButton,
              ...(isLoading && styles.submitButtonLoading)
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={styles.loadingText}>
                <span style={styles.spinner}>⏳</span> Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {msg && (
          <div style={{
            ...styles.message,
            ...(msg.includes('successfully') ? styles.successMessage : styles.errorMessage)
          }}>
            {msg}
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <button 
              style={styles.linkButton}
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1
  },
  
  backgroundShape1: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '300px',
    height: '300px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    opacity: 0.1,
    animation: 'float 6s ease-in-out infinite'
  },
  
  backgroundShape2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-15%',
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderRadius: '50%',
    opacity: 0.08,
    animation: 'float 8s ease-in-out infinite reverse'
  },
  
  backgroundShape3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    borderRadius: '50%',
    opacity: 0.05,
    animation: 'pulse 10s ease-in-out infinite'
  },
  
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    zIndex: 1
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  
  logoIcon: {
    fontSize: '32px',
    marginRight: '12px'
  },
  
  title: {
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  
  subtitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0 0 8px 0'
  },
  
  description: {
    fontSize: '16px',
    color: '#718096',
    margin: 0,
    lineHeight: '1.5'
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: '4px'
  },
  
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  
  inputIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    color: '#a0aec0',
    zIndex: 1
  },
  
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    color: '#2d3748'
  },
  
  helpText: {
    fontSize: '12px',
    color: '#718096',
    marginLeft: '4px',
    fontStyle: 'italic'
  },
  
  faceCaptureSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  faceCaptureWrapper: {
    border: '2px dashed #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#f7fafc',
    transition: 'all 0.3s ease'
  },
  
  submitButton: {
    padding: '16px 24px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    marginTop: '8px'
  },
  
  submitButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  
  message: {
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: '16px',
    animation: 'slideIn 0.3s ease'
  },
  
  successMessage: {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    border: '1px solid #9ae6b4'
  },
  
  errorMessage: {
    backgroundColor: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #feb2b2'
  },
  
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0'
  },
  
  footerText: {
    fontSize: '14px',
    color: '#718096',
    margin: 0
  },
  
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'color 0.3s ease'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.05; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.08; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .submitButton:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  }
  
  .linkButton:hover {
    color: #764ba2;
  }
  
  .faceCaptureWrapper:hover {
    border-color: #667eea;
    background-color: #f0f4ff;
  }
`;
document.head.appendChild(styleSheet);
