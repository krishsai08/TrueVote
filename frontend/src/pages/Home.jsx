import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: '🔐',
      title: 'Secure Authentication',
      description: 'Multi-factor authentication with face recognition technology'
    },
    {
      icon: '🗳️',
      title: 'Digital Voting',
      description: 'Cast your vote securely from anywhere with real-time verification'
    },
    {
      icon: '📊',
      title: 'Live Results',
      description: 'View election results in real-time with interactive charts'
    },
    {
      icon: '🛡️',
      title: 'Fraud Prevention',
      description: 'Advanced security measures to ensure election integrity'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Responsive design that works on all devices'
    },
    {
      icon: '⚡',
      title: 'Real-time Updates',
      description: 'Instant notifications and live election updates'
    }
  ];

  const stats = [
    { number: '99.9%', label: 'Uptime' },
    { number: '256-bit', label: 'Encryption' },
    { number: '24/7', label: 'Support' },
    { number: '0', label: 'Fraud Cases' }
  ];

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              Welcome to <span style={styles.highlight}>Smart eVoting</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Experience the future of democratic voting with our secure, transparent, and user-friendly digital voting platform.
            </p>
            <div style={styles.heroButtons}>
              {!user ? (
                <>
                  <button 
                    style={styles.primaryButton} 
                    onClick={() => navigate('/register')}
                  >
                    <span style={styles.buttonIcon}>🚀</span>
                    Get Started
                  </button>
                  <button 
                    style={styles.secondaryButton} 
                    onClick={() => navigate('/login')}
                  >
                    <span style={styles.buttonIcon}>🔑</span>
                    Sign In
                  </button>
                </>
              ) : (
                <button 
                  style={styles.primaryButton} 
                  onClick={() => navigate('/dashboard')}
                >
                  <span style={styles.buttonIcon}>📊</span>
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
          <div style={styles.heroVisual}>
            <div style={styles.heroImage}>
              <span style={styles.heroImageIcon}>🏛️</span>
              <div style={styles.heroImageText}>Democracy in Action</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={styles.statsSection}>
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div style={styles.statNumber}>{stat.number}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Why Choose Smart eVoting?</h2>
          <p style={styles.sectionSubtitle}>
            Our platform combines cutting-edge technology with user experience to deliver the most secure and accessible voting solution
          </p>
        </div>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} style={styles.featureCard}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={styles.howItWorksSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <p style={styles.sectionSubtitle}>
            Simple steps to participate in digital democracy
          </p>
        </div>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Register & Verify</h3>
              <p style={styles.stepDescription}>
                Create your account and complete identity verification with face recognition
              </p>
            </div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Browse Elections</h3>
              <p style={styles.stepDescription}>
                View available elections and check your eligibility
              </p>
            </div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Cast Your Vote</h3>
              <p style={styles.stepDescription}>
                Vote securely and receive instant confirmation
              </p>
            </div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Track Results</h3>
              <p style={styles.stepDescription}>
                Monitor live results and view detailed analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Make Your Voice Heard?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of users who trust Smart eVoting for secure and transparent elections
          </p>
          {!user && (
            <div style={styles.ctaButtons}>
              <button 
                style={styles.ctaPrimaryButton} 
                onClick={() => navigate('/register')}
              >
                <span style={styles.buttonIcon}>🎯</span>
                Start Voting Today
              </button>
              <button 
                style={styles.ctaSecondaryButton} 
                onClick={() => navigate('/login')}
              >
                <span style={styles.buttonIcon}>🔐</span>
                Already Have Account?
              </button>
            </div>
          )}
          {user && (
            <button 
              style={styles.ctaPrimaryButton} 
              onClick={() => navigate('/dashboard')}
            >
              <span style={styles.buttonIcon}>📊</span>
              Access Your Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>Smart eVoting</h3>
            <p style={styles.footerDescription}>
              Empowering democracy through secure digital voting technology
            </p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerSubtitle}>Quick Links</h4>
            <div style={styles.footerLinks}>
              <button style={styles.footerLink} onClick={() => navigate('/login')}>Login</button>
              <button style={styles.footerLink} onClick={() => navigate('/register')}>Register</button>
              {user && <button style={styles.footerLink} onClick={() => navigate('/dashboard')}>Dashboard</button>}
            </div>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerSubtitle}>Contact</h4>
            <p style={styles.footerText}>support@smarte-voting.com</p>
            <p style={styles.footerText}>+1 (555) 123-4567</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopyright}>
            © 2024 Smart eVoting. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },

  // Hero Section
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '80px 20px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  },

  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '60px'
  },

  heroText: {
    flex: 1
  },

  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '700',
    margin: '0 0 24px 0',
    lineHeight: '1.2'
  },

  highlight: {
    background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: 'none'
  },

  heroSubtitle: {
    fontSize: '1.25rem',
    margin: '0 0 32px 0',
    opacity: 0.9,
    lineHeight: '1.6'
  },

  heroButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },

  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#1f2937',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
  },

  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },

  buttonIcon: {
    fontSize: '20px'
  },

  heroVisual: {
    flex: '0 0 300px'
  },

  heroImage: {
    width: '300px',
    height: '300px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  heroImageIcon: {
    fontSize: '80px',
    marginBottom: '16px'
  },

  heroImageText: {
    fontSize: '18px',
    textAlign: 'center',
    opacity: 0.8
  },

  // Stats Section
  statsSection: {
    padding: '60px 20px',
    backgroundColor: 'white'
  },

  statsGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '32px'
  },

  statCard: {
    textAlign: 'center',
    padding: '32px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },

  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px'
  },

  statLabel: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '500'
  },

  // Features Section
  featuresSection: {
    padding: '80px 20px',
    backgroundColor: '#f8fafc'
  },

  sectionHeader: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto 60px'
  },

  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },

  sectionSubtitle: {
    fontSize: '1.125rem',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0
  },

  featuresGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px'
  },

  featureCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease'
  },

  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },

  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },

  featureDescription: {
    fontSize: '1rem',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0
  },

  // How It Works Section
  howItWorksSection: {
    padding: '80px 20px',
    backgroundColor: 'white'
  },

  stepsContainer: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px'
  },

  step: {
    textAlign: 'center',
    position: 'relative'
  },

  stepNumber: {
    width: '60px',
    height: '60px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0 auto 20px'
  },

  stepTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },

  stepDescription: {
    fontSize: '1rem',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0
  },

  // CTA Section
  ctaSection: {
    padding: '80px 20px',
    backgroundColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: 'white'
  },

  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center'
  },

  ctaTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: '0 0 16px 0'
  },

  ctaSubtitle: {
    fontSize: '1.125rem',
    opacity: 0.9,
    margin: '0 0 32px 0',
    lineHeight: '1.6'
  },

  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  ctaPrimaryButton: {
    backgroundColor: '#fbbf24',
    color: '#1f2937',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },

  ctaSecondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },

  // Footer
  footer: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '60px 20px 20px'
  },

  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    marginBottom: '40px'
  },

  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  footerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0
  },

  footerSubtitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: 0
  },

  footerDescription: {
    fontSize: '1rem',
    opacity: 0.8,
    lineHeight: '1.6',
    margin: 0
  },

  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  footerLink: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    textAlign: 'left',
    padding: '4px 0',
    cursor: 'pointer',
    opacity: 0.8,
    transition: 'opacity 0.3s ease'
  },

  footerText: {
    fontSize: '1rem',
    opacity: 0.8,
    margin: '4px 0',
    lineHeight: '1.6'
  },

  footerBottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '20px',
    textAlign: 'center'
  },

  footerCopyright: {
    fontSize: '0.875rem',
    opacity: 0.6,
    margin: 0
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .featureCard:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
  
  .primaryButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(251, 191, 36, 0.4);
  }
  
  .secondaryButton:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .ctaPrimaryButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(251, 191, 36, 0.4);
  }
  
  .ctaSecondaryButton:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .footerLink:hover {
    opacity: 1;
  }
  
  .stepNumber {
    position: relative;
  }
  
  .stepNumber::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, transparent);
    transform: translateY(-50%);
  }
  
  .step:last-child .stepNumber::after {
    display: none;
  }
  
  @media (max-width: 768px) {
    .stepNumber::after {
      display: none;
    }
    
    .heroContent {
      flex-direction: column;
      text-align: center;
    }
    
    .heroTitle {
      font-size: 2.5rem;
    }
    
    .heroButtons {
      justify-content: center;
    }
    
    .ctaButtons {
      flex-direction: column;
      align-items: center;
    }
  }
`;
document.head.appendChild(styleSheet);
