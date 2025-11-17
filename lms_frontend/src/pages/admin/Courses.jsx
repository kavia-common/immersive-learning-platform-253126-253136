import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { listAllCourses, setCourseStatus } from '../../lib/supabaseHelpers';
import { useUI } from '../../state/UIContext';

/**
 * Admin Courses page: list all courses across the system; approve or disable.
 */
 // PUBLIC_INTERFACE
export default function AdminCourses() {
  /** Admin page to list and moderate courses. */
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const { addToast } = useUI();

  const load = async () => {
    setLoading(true);
    const { data, error } = await listAllCourses({ q, limit: 50 });
    if (error) {
      addToast({ title: 'Failed to load courses', message: error.message || 'Error' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const onSetStatus = async (id, status) => {
    const { error } = await setCourseStatus(id, status);
    if (error) {
      addToast({ title: 'Update failed', message: error.message || 'Could not update status' });
    } else {
      addToast({ title: 'Course updated', message: `Status set to ${status}` });
      load();
    }
  };

  return (
    <div className="container" aria-labelledby="courses-heading">
      <h1 id="courses-heading" className="page-title">Courses</h1>
      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} aria-label="Search courses form">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Input id="search-courses" label="Search" placeholder="title or instructor" value={q} onChange={(e) => setQ(e.target.value)} />
              <Button variant="primary" type="submit" aria-label="Search courses">Search</Button>
            </div>
          </form>
          <div role="table" aria-label="Courses table" className="table-like">
            <div role="row" className="table-header">
              <div role="columnheader">Title</div>
              <div role="columnheader">Instructor</div>
              <div role="columnheader">Status</div>
              <div role="columnheader">Actions</div>
            </div>
            {loading ? <div role="row"><div role="cell">Loading…</div></div> : null}
            {!loading && items.map(c => (
              <div key={c.id} role="row" className="table-row">
                <div role="cell">{c.title}</div>
                <div role="cell">{c.instructor_name || '—'}</div>
                <div role="cell">{c.status || 'draft'}</div>
                <div role="cell" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="ghost" onClick={() => onSetStatus(c.id, 'draft')}>Draft</Button>
                  <Button size="sm" variant="ghost" onClick={() => onSetStatus(c.id, 'review')}>Review</Button>
                  <Button size="sm" variant="primary" onClick={() => onSetStatus(c.id, 'published')}>Publish</Button>
                  <Button size="sm" variant="danger" onClick={() => onSetStatus(c.id, 'disabled')}>Disable</Button>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 ? <div role="row"><div role="cell">No courses found.</div></div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
