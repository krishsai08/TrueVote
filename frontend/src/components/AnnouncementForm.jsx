import React, { useState, useEffect } from 'react';

export default function AnnouncementForm({ announcement = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        priority: announcement.priority || 'medium',
        expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : '',
        isActive: announcement.isActive !== undefined ? announcement.isActive : true
      });
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
    };
    onSubmit(submitData);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {announcement ? '✏️ Edit Announcement' : '📢 Create New Announcement'}
          </h2>
          <button style={styles.closeButton} onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter announcement title"
              required
              maxLength={200}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter announcement content"
              required
              rows={4}
              maxLength={2000}
            />
            <div style={styles.charCount}>
              {formData.content.length}/2000 characters
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Expiry Date (Optional)</label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Active (visible to users)</span>
            </label>
          </div>

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              {announcement ? 'Update Announcement' : 'Create Announcement'}
            </button>
          </div>
        </form>
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
    zIndex: 1000,
    padding: '20px'
  },

  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid #f1f5f9'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },

  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
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

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },

  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#1e293b',
    transition: 'all 0.3s ease'
  },

  textarea: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#1e293b',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease'
  },

  select: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  charCount: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'right',
    marginTop: '4px'
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },

  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#3b82f6'
  },

  checkboxText: {
    fontSize: '14px',
    color: '#374151'
  },

  formActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },

  cancelButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  submitButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

// Add focus and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .input:focus,
  .textarea:focus,
  .select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .closeButton:hover {
    background-color: #f1f5f9;
    color: #475569;
  }
  
  .cancelButton:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .submitButton:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;
document.head.appendChild(styleSheet); 