import React, { useState } from 'react';
import api from '../api/client';
import FaceCapture from '../components/FaceCapture';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', occupation: '' });
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!faceEmbedding) return setMsg('Please capture your face.');
    try {
      await api.post('/auth/register', { ...form, faceEmbedding });
      setMsg('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 750); // redirect after 1.5s
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Register</h2>
        <form onSubmit={submit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Age"
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Occupation"
            value={form.occupation}
            onChange={e => setForm({ ...form, occupation: e.target.value })}
          />
          <FaceCapture
            onEmbedding={setFaceEmbedding}
            buttonText={faceEmbedding ? 'Face Captured' : 'Capture Face'}
          />
          <button type="submit" style={styles.button}>Create Account</button>
        </form>
        {msg && <p style={styles.msg}>{msg}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 400
  },
  heading: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#333'
  },
  form: {
    display: 'grid',
    gap: 16
  },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ccc',
    fontSize: 16,
    outline: 'none',
    transition: 'border 0.2s',
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
  },
  msg: {
    textAlign: 'center',
    marginTop: 12,
    color: 'crimson'
  }
};
