import React, { useState, useEffect } from 'react';
import api from '../api/client';
import FaceCapture from '../components/FaceCapture';
import OTPVerification from '../components/OTPVerification';
import { useParams, useNavigate } from 'react-router-dom';
import socketManager from '../utils/socket.js';
import { useAuth } from '../context/AuthContext';

export default function Vote() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [faceVerified, setFaceVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [msg, setMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // <-- Add this line
  const [step, setStep] = useState(1); // 1: Select Candidate, 2: Face Verification, 3: OTP Verification, 4: Confirm Vote

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const { data } = await api.get(`/elections/user/${electionId}`);
        setElection(data.election);
      } catch (err) {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        const message = err?.response?.data?.message || 'Error fetching election';
        if (status === 403 && code === 'ALREADY_VOTED_WAIT_FOR_RESULTS') {
          setMsg(message);
          setTimeout(() => navigate('/dashboard'), 2500);
          return;
        }
        setMsg(message);
      }
    };
    fetchElection();

    // Connect to WebSocket
    socketManager.connect();
    socketManager.joinElection(electionId);

    // Listen for real-time updates
    const handleVoteCast = (data) => {
      if (data.electionId === electionId) {
        setMsg(`New vote cast! Total votes: ${data.totalVotes}`);
        setTimeout(() => setMsg(''), 3000);
      }
    };

    const handleResultsReleased = (data) => {
      if (data.electionId === electionId) {
        setElection(prev => ({ ...prev, resultsReleased: true }));
        setMsg('Results have been released!');
        setTimeout(() => setMsg(''), 3000);
      }
    };

    // Set up event listeners
    socketManager.on('vote-cast', handleVoteCast);
    socketManager.on('results-released', handleResultsReleased);

    // Cleanup function
    return () => {
      socketManager.leaveElection(electionId);
      socketManager.off('vote-cast', handleVoteCast);
      socketManager.off('results-released', handleResultsReleased);
    };
  }, [electionId]);

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setStep(2);
  };

  const handleFaceVerified = () => {
    setFaceVerified(true);
    setStep(3);
  };

  const handleOTPVerified = (token) => {
    setOtpVerified(true);
    setVerificationToken(token);
    setStep(4);
  };

  const submitVote = async () => {
    if (!selectedCandidate) return setMsg('Select a candidate');
    if (!faceVerified) return setMsg('Please verify your face');
    if (!otpVerified) return setMsg('Please complete OTP verification');

    setIsSubmitting(true);
    try {
      // Ensure we send exactly what's stored
      const candidate = election.candidates.find(c => c === selectedCandidate);

      if (!candidate) {
        return setMsg('Invalid candidate option');
      }

      await api.post(`/votes/${electionId}`, { 
        candidate, 
        faceVerified, 
        verificationToken 
      });
      setMsg('Vote cast successfully!');
      
      // Clear selection after successful vote
      setSelectedCandidate('');
      setFaceVerified(false);
      setOtpVerified(false);
      setVerificationToken('');
      setStep(1);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Error casting vote';
      
      // Handle specific error cases
      if (errorMessage.includes('date of birth not set')) {
        setMsg('Profile incomplete. Please update your profile with your date of birth before voting.');
      } else if (errorMessage.includes('not eligible')) {
        setMsg('You are not eligible to vote in this election based on age requirements.');
      } else if (errorMessage.includes('already voted')) {
        setMsg('You have already voted in this election.');
      } else if (errorMessage.includes('Face verification failed')) {
        setMsg('Face verification failed. Please try again.');
      } else {
        setMsg(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!election) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>⏳</div>
        <p style={styles.loadingText}>Loading election details...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Elements */}
      <div style={styles.background}>
        <div style={styles.backgroundShape1}></div>
        <div style={styles.backgroundShape2}></div>
        <div style={styles.backgroundShape3}></div>
      </div>

      {/* Header Section */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <span style={styles.backIcon}>←</span>
          Back to Dashboard
        </button>
        <div style={styles.electionInfo}>
          <h1 style={styles.electionTitle}>{election.title}</h1>
          <div style={styles.electionMeta}>
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>📅</span>
              {new Date(election.startTime).toLocaleDateString()} - {new Date(election.endTime).toLocaleDateString()}
            </span>
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>👥</span>
              {election.candidates?.length || 0} Candidates
            </span>
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>🕐</span>
              {election.status === 'ongoing' ? 'Voting Open' : election.status}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={styles.progressContainer}>
        <div style={styles.progressSteps}>
          <div style={{
            ...styles.progressStep,
            ...(step >= 1 && styles.progressStepActive)
          }}>
            <span style={styles.stepNumber}>1</span>
            <span style={styles.stepLabel}>Select Candidate</span>
          </div>
          <div style={{
            ...styles.progressStep,
            ...(step >= 2 && styles.progressStepActive)
          }}>
            <span style={styles.stepNumber}>2</span>
            <span style={styles.stepLabel}>Face Verification</span>
          </div>
          <div style={{
            ...styles.progressStep,
            ...(step >= 3 && styles.progressStepActive)
          }}>
            <span style={styles.stepNumber}>3</span>
            <span style={styles.stepLabel}>OTP Verification</span>
          </div>
          <div style={{
            ...styles.progressStep,
            ...(step >= 4 && styles.progressStepActive)
          }}>
            <span style={styles.stepNumber}>4</span>
            <span style={styles.stepLabel}>Confirm Vote</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Step 1: Candidate Selection */}
        {step === 1 && (
          <div style={styles.stepContainer}>
            <div style={styles.stepHeader}>
              <span style={styles.stepIcon}>🗳️</span>
              <h2 style={styles.stepTitle}>Choose Your Candidate</h2>
              <p style={styles.stepDescription}>
                Select the candidate you want to vote for. This choice cannot be changed once submitted.
              </p>
            </div>
            
            <div style={styles.candidatesGrid}>
              {election.candidates.map((candidate, index) => (
                <div
                  key={candidate}
                  style={{
                    ...styles.candidateCard,
                    ...(selectedCandidate === candidate && styles.candidateCardSelected)
                  }}
                  onClick={() => handleCandidateSelect(candidate)}
                >
                  <div style={styles.candidateAvatar}>
                    <span style={styles.candidateInitial}>
                      {candidate.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 style={styles.candidateName}>{candidate}</h3>
                  <p style={styles.candidateNumber}>Candidate #{index + 1}</p>
                  {selectedCandidate === candidate && (
                    <div style={styles.selectedIndicator}>
                      <span style={styles.checkIcon}>✅</span>
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Face Verification */}
        {step === 2 && (
          <div style={styles.stepContainer}>
            <div style={styles.stepHeader}>
              <span style={styles.stepIcon}>📷</span>
              <h2 style={styles.stepTitle}>Face Verification Required</h2>
              <p style={styles.stepDescription}>
                Please verify your identity using face recognition to ensure secure voting.
              </p>
            </div>
            
            <div style={styles.faceVerificationContainer}>
              <div style={styles.verificationCard}>
                <div style={styles.verificationIcon}>🔐</div>
                <h3 style={styles.verificationTitle}>Security Check</h3>
                <p style={styles.verificationText}>
                  This step ensures that only authorized users can cast votes and prevents duplicate voting.
                </p>
                
                <div style={styles.profileCheck}>
                  <span style={styles.checkIcon}>✅</span>
                  <span style={styles.checkText}>
                    Make sure your profile is complete with your date of birth before proceeding.
                  </span>
                </div>
                
                <div style={styles.profileActions}>
                  <button 
                    style={styles.profileBtn}
                    onClick={() => navigate('/profile')}
                  >
                    <span style={styles.profileIcon}>👤</span>
                    Update Profile
                  </button>
                </div>
                
                <FaceCapture
                  onEmbedding={handleFaceVerified}
                  buttonText={faceVerified ? 'Face Verified ✅' : 'Start Face Verification'}
                />
                
                {faceVerified && (
                  <div style={styles.verificationSuccess}>
                    <span style={styles.successIcon}>🎉</span>
                    <span style={styles.successText}>Identity verified successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <div style={styles.stepContainer}>
            <div style={styles.stepHeader}>
              <span style={styles.stepIcon}>🔐</span>
              <h2 style={styles.stepTitle}>OTP Verification Required</h2>
              <p style={styles.stepDescription}>
                To ensure the security of your vote, please verify your identity with the OTP sent to your email.
              </p>
            </div>
            
            <div style={styles.otpContainer}>
              <OTPVerification
                electionId={electionId}
                electionTitle={election.title}
                onVerificationSuccess={handleOTPVerified}
                onCancel={() => setStep(2)}
                userEmail={user?.email}
              />
            </div>
          </div>
        )}

        {/* Step 4: Vote Confirmation */}
        {step === 4 && (
          <div style={styles.stepContainer}>
            <div style={styles.stepHeader}>
              <span style={styles.stepIcon}>✅</span>
              <h2 style={styles.stepTitle}>Confirm Your Vote</h2>
              <p style={styles.stepDescription}>
                Please review your selection before submitting. This action cannot be undone.
              </p>
            </div>
            
            <div style={styles.confirmationContainer}>
              <div style={styles.confirmationCard}>
                <div style={styles.confirmationHeader}>
                  <span style={styles.confirmationIcon}>🗳️</span>
                  <h3 style={styles.confirmationTitle}>Vote Summary</h3>
                </div>
                
                <div style={styles.confirmationDetails}>
                  <div style={styles.confirmationItem}>
                    <span style={styles.confirmationLabel}>Election:</span>
                    <span style={styles.confirmationValue}>{election.title}</span>
                  </div>
                  <div style={styles.confirmationItem}>
                    <span style={styles.confirmationLabel}>Your Choice:</span>
                    <span style={styles.confirmationValue}>{selectedCandidate}</span>
                  </div>
                  <div style={styles.confirmationItem}>
                    <span style={styles.confirmationLabel}>Face Verified:</span>
                    <span style={styles.confirmationValue}>
                      <span style={styles.verifiedBadge}>✅ Verified</span>
                    </span>
                  </div>
                </div>
                
                <div style={styles.confirmationActions}>
                  <button 
                    style={styles.backToStepBtn}
                    onClick={() => setStep(1)}
                  >
                    <span style={styles.backIcon}>←</span>
                    Change Selection
                  </button>
                  
                  <button 
                    style={{
                      ...styles.submitVoteBtn,
                      ...(isSubmitting && styles.submitVoteBtnLoading)
                    }}
                    onClick={submitVote}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span style={styles.loadingText}>
                        <span style={styles.spinner}>⏳</span>
                        Casting Vote...
                      </span>
                    ) : (
                      <>
                        <span style={styles.submitIcon}>🗳️</span>
                        Cast My Vote
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {msg && (
        <div style={{
          ...styles.message,
          ...(msg.includes('successfully') ? styles.successMessage : styles.errorMessage)
        }}>
          <span style={styles.messageIcon}>
            {msg.includes('successfully') ? '🎉' : '⚠️'}
          </span>
          {msg}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          <span style={styles.footerIcon}>🔒</span>
          Your vote is secure and confidential. Thank you for participating in democracy.
        </p>
      </div>
    </div>
  );
}

// Modern, beautiful styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f9ff',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },

  // Background Elements
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
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    borderRadius: '50%',
    opacity: 0.06,
    animation: 'float 6s ease-in-out infinite'
  },

  backgroundShape2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-15%',
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    borderRadius: '50%',
    opacity: 0.05,
    animation: 'float 8s ease-in-out infinite reverse'
  },

  backgroundShape3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    borderRadius: '50%',
    opacity: 0.04,
    animation: 'pulse 10s ease-in-out infinite'
  },

  // Loading State
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px'
  },

  loadingSpinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite'
  },

  loadingText: {
    fontSize: '18px',
    color: '#0369a1',
    margin: 0
  },

  // Header
  header: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(3, 105, 161, 0.08)',
    border: '1px solid #e0f2fe',
    position: 'relative'
  },

  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },

  

  electionInfo: {
    textAlign: 'center',
    paddingTop: '20px'
  },

  electionTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 20px 0',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },

  electionMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },

  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #bae6fd'
  },

  metaIcon: {
    fontSize: '16px'
  },

  // Progress Steps
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(3, 105, 161, 0.08)',
    border: '1px solid #e0f2fe'
  },

  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative'
  },

  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    zIndex: 1
  },

  progressStepActive: {
    color: '#ec4899'
  },

  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },

  stepLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    textAlign: 'center'
  },

  // Content
  content: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(3, 105, 161, 0.08)',
    border: '1px solid #e0f2fe'
  },

  stepContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },

  stepHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },

  stepIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },

  stepTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },

  stepDescription: {
    fontSize: '1.1rem',
    color: '#0369a1',
    margin: 0,
    lineHeight: '1.6'
  },

  // Candidates Grid
  candidatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },

  candidateCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: '16px',
    padding: '24px',
    border: '2px solid #bae6fd',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },

  candidateCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(236, 72, 153, 0.25)'
  },

  candidateAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto'
  },

  candidateInitial: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white'
  },

  candidateName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },

  candidateNumber: {
    fontSize: '0.875rem',
    color: '#0369a1',
    margin: 0
  },

  selectedIndicator: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },

  checkIcon: {
    fontSize: '12px'
  },

  // Face Verification
  faceVerificationContainer: {
    display: 'flex',
    justifyContent: 'center'
  },

  verificationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #bae6fd',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%'
  },

  verificationIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    display: 'block'
  },

  verificationTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },

  verificationText: {
    fontSize: '1rem',
    color: '#0369a1',
    margin: '0 0 24px 0',
    lineHeight: '1.6'
  },

  profileCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    backgroundColor: '#e0f2fe',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid #bae6fd'
  },

  checkText: {
    fontSize: '0.9rem',
    color: '#0369a1',
    fontWeight: '500'
  },

  profileActions: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px'
  },

  profileBtn: {
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
  },

  profileIcon: {
    fontSize: '18px'
  },

  verificationSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '16px',
    borderRadius: '12px',
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center'
  },

  successIcon: {
    fontSize: '20px'
  },

  successText: {
    fontSize: '1rem',
    fontWeight: '500'
  },

  // Confirmation
  confirmationContainer: {
    display: 'flex',
    justifyContent: 'center'
  },

  confirmationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #bae6fd',
    maxWidth: '500px',
    width: '100%'
  },

  confirmationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    justifyContent: 'center'
  },

  confirmationIcon: {
    fontSize: '32px'
  },

  confirmationTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  confirmationDetails: {
    marginBottom: '24px'
  },

  confirmationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #bae6fd'
  },

  confirmationLabel: {
    fontSize: '1rem',
    color: '#0369a1',
    fontWeight: '500'
  },

  confirmationValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: '600'
  },

  verifiedBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },

  confirmationActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center'
  },

  backToStepBtn: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    padding: '16px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },

  backIcon: {
    fontSize: '16px'
  },

  submitVoteBtn: {
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
  },

  submitVoteBtnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },

  submitIcon: {
    fontSize: '18px'
  },

  // Messages
  message: {
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    animation: 'slideIn 0.3s ease'
  },

  successMessage: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  },

  errorMessage: {
    backgroundColor: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #fecaca'
  },

  messageIcon: {
    fontSize: '20px'
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '24px',
    color: '#0369a1'
  },

  footerText: {
    fontSize: '0.875rem',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center'
  },

  footerIcon: {
    fontSize: '16px'
  },

  otpContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px 0'
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .candidateCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(3, 105, 161, 0.15);
    border-color: #7dd3fc;
  }
  
  .backBtn:hover {
    background-color: #e0f2fe;
    border-color: #7dd3fc;
    transform: translateY(-2px);
  }
  
  .submitVoteBtn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
  }
  
  .profileBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
  }
  
  .backToStepBtn:hover {
    background-color: #e0f2fe;
    border-color: #7dd3fc;
    transform: translateY(-2px);
  }
  
  .progressStepActive .stepNumber {
    background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
  }
  
  .progressStepActive .stepLabel {
    color: #ec4899;
    font-weight: 600;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.04; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.06; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);
