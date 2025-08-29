import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome to eVoting System</h1>
        {!user && (
          <div style={styles.buttons}>
            <button style={styles.button} onClick={() => navigate('/login')}>Login</button>
            <button style={styles.button} onClick={() => navigate('/register')}>Register</button>
          </div>
        )}
        {user && (
          <div style={styles.buttons}>
            <button style={styles.button} onClick={() => navigate('/')}>Go to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px 30px',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: 400,
    width: '100%'
  },
  heading: {
    color: '#333',
    marginBottom: 30
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  button: {
    padding: '12px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#4b9ce2',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};
