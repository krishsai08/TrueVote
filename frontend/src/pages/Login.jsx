import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);

      // Redirect based on role
      if (data.role === 'admin') navigate('/dashboard');
      else navigate('/dashboard'); // regular user dashboard
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Login</h2>
        <form onSubmit={submit} style={styles.form}>
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
          <button type="submit" style={styles.button}>Sign In</button>
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
