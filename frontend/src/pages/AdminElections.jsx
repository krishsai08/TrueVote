import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminElections() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: '',
    candidatesCSV: '',
    startTime: '',
    endTime: '',
    ageGroups: []
  });
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/elections');
      setList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const addAgeGroup = () => {
    setForm(prev => ({ ...prev, ageGroups: [...prev.ageGroups, { min: '', max: '' }] }));
  };

  const removeAgeGroup = (idx) => {
    setForm(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.filter((_, i) => i !== idx)
    }));
  };

  const updateAgeGroup = (idx, key, value) => {
    setForm(prev => {
      const newGroups = [...prev.ageGroups];
      newGroups[idx][key] = value;
      return { ...prev, ageGroups: newGroups };
    });
  };

  const createElection = async () => {
    try {
      const payload = {
        title: form.title.trim(),
        candidates: form.candidatesCSV, // backend normalizes string/array
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
        eligibleAgeGroups: form.ageGroups.map(g => ({ min: Number(g.min), max: Number(g.max) }))
      };
      await api.post('/admin/elections', payload);
      setMsg('Election created');
      setForm({ title: '', candidatesCSV: '', startTime: '', endTime: '', ageGroups: [] });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error');
    }
  };

  // --- extend election ---
  const extendElection = async (id) => {
    const minutes = prompt('Extend by how many minutes?');
    if (!minutes || isNaN(minutes)) return;
    try {
      const { data } = await api.patch(`/admin/elections/${id}/extend`, { extraMinutes: Number(minutes) });
      alert(data.message);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error extending election');
    }
  };

  return (
    <div>
      <h2>Admin — Elections</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 500 }}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Candidates (comma separated)"
          value={form.candidatesCSV}
          onChange={e => setForm({ ...form, candidatesCSV: e.target.value })}
        />
        <label>
          Start Time
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
          />
        </label>
        <label>
          End Time
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
          />
        </label>

        <h4>Eligible Age Groups</h4>
        {form.ageGroups.map((g, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="Min Age"
              value={g.min}
              onChange={e => updateAgeGroup(idx, 'min', e.target.value)}
            />
            <input
              type="number"
              placeholder="Max Age"
              value={g.max}
              onChange={e => updateAgeGroup(idx, 'max', e.target.value)}
            />
            <button type="button" onClick={() => removeAgeGroup(idx)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addAgeGroup}>Add Age Group</button>

        <button onClick={createElection}>Create</button>
        {msg && <p>{msg}</p>}
      </div>

      <h3>All Elections</h3>
      <ul>
        {list.map(e => (
          <li key={e._id}>
            <b>{e.title}</b> — {e.status} ({new Date(e.startTime).toLocaleString()} → {new Date(e.endTime).toLocaleString()})
            {e.eligibleAgeGroups?.length > 0 && (
              <span> | Ages: {e.eligibleAgeGroups.map(g => `${g.min}-${g.max}`).join(', ')}</span>
            )}
            {' '}
            <button onClick={() => extendElection(e._id)}>Extend</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
