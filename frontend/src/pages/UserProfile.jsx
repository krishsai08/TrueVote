import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    dateOfBirth: '',
    occupation: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data);
      setEditForm({
        name: data.name || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        occupation: data.occupation || ''
      });
      setLoading(false);
    } catch (err) {
      setMsg('Failed to fetch profile');
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', editForm);
      setProfile(data);
      setIsEditing(false);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMsg('New password must be at least 6 characters');
      return;
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMsg('Password changed successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!profile) return <div style={styles.error}>Profile not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Profile</h1>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {msg && (
        <div style={styles.message}>
          {msg}
        </div>
      )}

      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={styles.profileInfo}>
            <h2 style={styles.name}>{profile.name}</h2>
            <p style={styles.email}>{profile.email}</p>
            <p style={styles.role}>Role: {profile.role}</p>
          </div>
        </div>

        <div style={styles.profileDetails}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Name:</span>
            <span style={styles.value}>{profile.name}</span>
          </div>
          
          <div style={styles.detailRow}>
            <span style={styles.label}>Email:</span>
            <span style={styles.value}>{profile.email}</span>
          </div>
          
          <div style={styles.detailRow}>
            <span style={styles.label}>Date of Birth:</span>
            <span style={styles.value}>
              {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
            </span>
          </div>
          
          <div style={styles.detailRow}>
            <span style={styles.label}>Age:</span>
            <span style={styles.value}>{profile.age || 'Not calculated'}</span>
          </div>
          
          <div style={styles.detailRow}>
            <span style={styles.label}>Occupation:</span>
            <span style={styles.value}>{profile.occupation || 'Not specified'}</span>
          </div>
          
          <div style={styles.detailRow}>
            <span style={styles.label}>Member Since:</span>
            <span style={styles.value}>
              {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={styles.actions}>
          <button 
            style={styles.editBtn} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          
          <button 
            style={styles.passwordBtn} 
            onClick={() => setIsChangingPassword(!isChangingPassword)}
          >
            {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
          </button>
          
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div style={styles.formCard}>
          <h3>Edit Profile</h3>
          <form onSubmit={handleEditSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Name:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={styles.formInput}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Date of Birth:</label>
              <input
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                style={styles.formInput}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Occupation:</label>
              <input
                type="text"
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                style={styles.formInput}
              />
            </div>
            
            <button type="submit" style={styles.submitBtn}>
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Change Password Form */}
      {isChangingPassword && (
        <div style={styles.formCard}>
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Current Password:</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                style={styles.formInput}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>New Password:</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                style={styles.formInput}
                required
                minLength={6}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Confirm New Password:</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                style={styles.formInput}
                required
                minLength={6}
              />
            </div>
            
            <button type="submit" style={styles.submitBtn}>
              Change Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#333',
    margin: 0
  },
  backBtn: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#4b9ce2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    marginRight: '20px'
  },
  profileInfo: {
    flex: 1
  },
  name: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '24px'
  },
  email: {
    margin: '0 0 4px 0',
    color: '#666',
    fontSize: '16px'
  },
  role: {
    margin: 0,
    color: '#888',
    fontSize: '14px',
    textTransform: 'capitalize'
  },
  profileDetails: {
    marginBottom: '30px'
  },
  detailRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid #eee'
  },
  label: {
    fontWeight: 'bold',
    width: '150px',
    color: '#555'
  },
  value: {
    flex: 1,
    color: '#333'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  editBtn: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  passwordBtn: {
    backgroundColor: '#ffc107',
    color: '#212529',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  logoutBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formLabel: {
    fontWeight: 'bold',
    color: '#555'
  },
  formInput: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px'
  },
  submitBtn: {
    backgroundColor: '#4b9ce2',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#dc3545'
  }
}; 