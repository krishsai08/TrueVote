import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from "react-router-dom";
import socketManager from '../utils/socket.js';

export default function AdminElections() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: '',
    candidatesCSV: '',
    startTime: '',
    endTime: '',
    ageGroups: []
  });
  const [msg, setMsg] = useState('');

  // popup states
  const [extendPopup, setExtendPopup] = useState({ open: false, id: null });
  const [extendDate, setExtendDate] = useState('');
  const [suspendPopup, setSuspendPopup] = useState({ open: false, id: null });
  const [deletePopup, setDeletePopup] = useState({ open: false, id: null, title: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/admin/elections'); // admin route
      setList(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    load(); 
    
    // Connect to WebSocket
    socketManager.connect();
    socketManager.joinAdmin();

    // Listen for real-time updates
    const handleElectionUpdated = (data) => {
      // Update elections list based on the action
      setList(prev => prev.map(election => {
        if (election._id === data.electionId) {
          switch (data.action) {
            case 'vote-cast':
              return { ...election, voteCount: (election.voteCount || 0) + 1 };
            case 'results-released':
              return { ...election, resultsReleased: true };
            case 'suspended':
              return { ...election, status: 'suspended' };
            case 'resumed':
              return { ...election, status: 'active' };
            default:
              return election;
          }
        }
        return election;
      }));
    };

    // Set up event listener
    socketManager.on('election-updated', handleElectionUpdated);

    // Cleanup function
    return () => {
      socketManager.off('election-updated', handleElectionUpdated);
    };
  }, []);

  const addAgeGroup = () => setForm(prev => ({ ...prev, ageGroups: [...prev.ageGroups, { min: '', max: '' }] }));
  const removeAgeGroup = idx => setForm(prev => ({ ...prev, ageGroups: prev.ageGroups.filter((_, i) => i !== idx) }));
  const updateAgeGroup = (idx, key, value) => {
    setForm(prev => {
      const newGroups = [...prev.ageGroups];
      newGroups[idx][key] = value;
      return { ...prev, ageGroups: newGroups };
    });
  };

  // Create election
  const createElection = async () => {
    try {
      const payload = {
        title: form.title.trim(),
        candidates: form.candidatesCSV,
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
        eligibleAgeGroups: form.ageGroups.map(g => ({ min: Number(g.min), max: Number(g.max) }))
      };
      await api.post('/admin/elections', payload); // admin route
      setMsg('Election created');
      setForm({ title: '', candidatesCSV: '', startTime: '', endTime: '', ageGroups: [] });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error');
    }
  };

  // Extend election
  const extendElection = async () => {
    if (!extendDate || !extendPopup.id) return;
    try {
      const isoDate = new Date(extendDate).toISOString();
      const { data } = await api.patch(`/admin/elections/${extendPopup.id}/extend`, { newEndDate: isoDate }); // admin route
      setMsg(data.message);
      setExtendPopup({ open: false, id: null });
      setExtendDate('');
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error extending election');
    }
  };

  // Suspend election
  const suspendElection = async () => {
    if (!suspendPopup.id) return;
    try {
      const { data } = await api.patch(`/admin/elections/${suspendPopup.id}/suspend`); // admin route
      setMsg(data.message);
      setSuspendPopup({ open: false, id: null });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error suspending election');
    }
  };

  // Resume election
  const resumeElection = async (id, newEndDate = null) => {
    try {
      let payload = {};
      if (newEndDate) payload.newEndDate = new Date(newEndDate).toISOString();
      const { data } = await api.patch(`/admin/elections/${id}/resume`, payload); // admin route
      setMsg(data.message);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error resuming election');
    }
  };

  // Delete election
  const deleteElection = async () => {
    if (!deletePopup.id) return;
    try {
      await api.delete(`/admin/elections/${deletePopup.id}`); // admin route
      setMsg('Election deleted successfully');
      setDeletePopup({ open: false, id: null, title: '' });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error deleting election');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f0e1, #e1c699)', color: '#333', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '100%', maxWidth: '700px', textAlign: 'center', position: 'relative' }}>
        <h2 style={{ marginBottom: '20px', color: '#5c3d2e' }}>Admin — Elections</h2>

        {/* Create Election Form */}
        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input placeholder="Candidates (comma separated)" value={form.candidatesCSV} onChange={e => setForm({ ...form, candidatesCSV: e.target.value })} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <label>Start Time<input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }} /></label>
          <label>End Time<input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }} /></label>

          <h4 style={{ margin: '10px 0', color: '#5c3d2e' }}>Eligible Age Groups</h4>
          {form.ageGroups.map((g, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <input type="number" placeholder="Min Age" value={g.min} onChange={e => updateAgeGroup(idx, 'min', e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ccc' }} />
              <input type="number" placeholder="Max Age" value={g.max} onChange={e => updateAgeGroup(idx, 'max', e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ccc' }} />
              <button type="button" onClick={() => removeAgeGroup(idx)} style={{ background: '#d9534f', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addAgeGroup} style={{ background: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>Add Age Group</button>
          <button onClick={createElection} style={{ background: '#5c3d2e', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}>Create</button>
          {msg && <p style={{ color: '#5c3d2e' }}>{msg}</p>}
        </div>

        {/* Elections List */}
        <h3 style={{ marginTop: 20, marginBottom: 10, color: '#5c3d2e' }}>All Elections</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Title</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Start</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>End</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Age Groups</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => (
              <tr key={e._id} style={{ borderBottom: '1px solid #ddd', cursor: 'pointer' }} onClick={() => navigate(`/admin/elections/${e._id}`)}>
                <td style={{ padding: '10px' }}><b>{e.title}</b></td>
                <td style={{ padding: '10px' }}>{e.status}</td>
                <td style={{ padding: '10px' }}>{new Date(e.startTime).toLocaleString()}</td>
                <td style={{ padding: '10px' }}>{new Date(e.endTime).toLocaleString()}</td>
                <td style={{ padding: '10px' }}>{e.eligibleAgeGroups?.length > 0 ? e.eligibleAgeGroups.map(g => `${g.min}-${g.max}`).join(', ') : '—'}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={ev => { ev.stopPropagation(); setExtendPopup({ open: true, id: e._id }); }} style={{ marginRight: 6, background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>Extend</button>
                  <button onClick={ev => { ev.stopPropagation(); setSuspendPopup({ open: true, id: e._id }); }} style={{ marginRight: 6, background: '#ff9800', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>Suspend</button>
                  <button onClick={ev => { ev.stopPropagation(); resumeElection(e._id); }} style={{ marginRight: 6, background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>Resume</button>
                  <button onClick={ev => { ev.stopPropagation(); setDeletePopup({ open: true, id: e._id, title: e.title }); }} style={{ marginLeft: 6, background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Extend Popup */}
        {extendPopup.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <h4 style={{ marginBottom: 12 }}>Select New End Time</h4>
              <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8, marginBottom: 12 }} />
              <div>
                <button onClick={extendElection} style={{ background: '#28a745', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8, marginRight: 8 }}>Save</button>
                <button onClick={() => setExtendPopup({ open: false, id: null })} style={{ background: '#6c757d', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Popup */}
        {suspendPopup.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <h4 style={{ marginBottom: 12 }}>Suspend Election?</h4>
              <p style={{ marginBottom: 16 }}>Are you sure you want to suspend this election?</p>
              <div>
                <button onClick={suspendElection} style={{ background: '#ff9800', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8, marginRight: 8 }}>Confirm</button>
                <button onClick={() => setSuspendPopup({ open: false, id: null })} style={{ background: '#6c757d', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Popup */}
        {deletePopup.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <h4 style={{ marginBottom: 12, color: '#dc3545' }}>⚠️ Delete Election</h4>
              <p style={{ marginBottom: 16 }}>
                Are you sure you want to delete <strong>"{deletePopup.title}"</strong>?
              </p>
              <p style={{ marginBottom: 16, color: '#dc3545', fontSize: '14px' }}>
                This action cannot be undone. All votes and data associated with this election will be permanently removed.
              </p>
              <div>
                <button onClick={deleteElection} style={{ background: '#dc3545', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8, marginRight: 8 }}>Delete Permanently</button>
                <button onClick={() => setDeletePopup({ open: false, id: null, title: '' })} style={{ background: '#6c757d', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
