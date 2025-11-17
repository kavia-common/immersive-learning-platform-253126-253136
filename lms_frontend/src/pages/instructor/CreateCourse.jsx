import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useUI } from '../../state/UIContext';
import { createCourse } from '../../lib/supabaseHelpers';
import { useNavigate } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function CreateCourse() {
  /**
   * Full course creation form for instructors.
   */
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    thumbnail_url: ''
  });
  const [saving, setSaving] = useState(false);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      addToast({ title: 'Missing title', message: 'Please provide a course title.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category || null,
        level: form.level || null,
        price: form.price ? Number(form.price) : 0,
        thumbnail_url: form.thumbnail_url || null
      };
      const { data, error } = await createCourse(payload);
      if (error) {
        addToast({ title: 'Create failed', message: error.message || 'Try again.', variant: 'error' });
        return;
      }
      addToast({ title: 'Course created', message: 'Proceed to add modules and lessons.', variant: 'success' });
      navigate(`/instructor/manage/${data.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Create Course</h2>
        <p style={{ color: 'var(--muted-700)' }}>
          Enter course details. You can add modules and lessons after creation.
        </p>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <Input label="Title" value={form.title} onChange={onChange('title')} required />
          <div className="oui-field">
            <label className="oui-label" htmlFor="desc">Description</label>
            <textarea id="desc" className="oui-input" rows={5} value={form.description} onChange={onChange('description')} />
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <Input label="Category" value={form.category} onChange={onChange('category')} />
            <div className="oui-field">
              <label className="oui-label" htmlFor="level">Level</label>
              <select id="level" className="oui-input" value={form.level} onChange={onChange('level')}>
                {['Beginner','Intermediate','Advanced'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <Input label="Price (USD)" type="number" step="0.01" value={form.price} onChange={onChange('price')} />
          </div>
          <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={onChange('thumbnail_url')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" type="button" onClick={() => window.history.back()}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create course'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
