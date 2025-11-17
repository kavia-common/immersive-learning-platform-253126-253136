import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { listMyCourses, createCourse } from '../../lib/supabaseHelpers';

// PUBLIC_INTERFACE
export default function InstructorDashboard() {
  /**
   * Instructor landing page listing instructor's courses with quick actions.
   */
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await listMyCourses();
        if (!mounted) return;
        if (res.error) {
          addToast({ title: 'Load failed', message: 'Could not load your courses', variant: 'error' });
          setCourses([]);
        } else {
          setCourses(res.data || []);
        }
      } catch (e) {
        logger.error('InstructorDashboard load error', { err: e?.message });
        addToast({ title: 'Error', message: 'Unable to load courses', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [addToast]);

  const onQuickCreate = async () => {
    if (!newTitle) {
      addToast({ title: 'Missing title', message: 'Please enter a course title.' });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await createCourse({
        title: newTitle,
        description: '',
        category: newCategory || null,
        level: 'Beginner',
        price: 0
      });
      if (error) {
        addToast({ title: 'Create failed', message: error.message || 'Try again.', variant: 'error' });
      } else {
        addToast({ title: 'Course created', message: 'Redirecting to manage course…', variant: 'success' });
        navigate(`/instructor/manage/${data.id}`);
      }
    } catch (e) {
      logger.error('Quick create error', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to create course', variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Instructor Dashboard</h2>
        <p style={{ color: 'var(--muted-700)' }}>
          Manage your courses, lessons, and student outcomes. Build engaging content with the Content Builder.
        </p>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Create a new course</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto' }}>
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <Button variant="primary" onClick={onQuickCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Button as={Link} to="/instructor/create" variant="ghost">Open full creator</Button>
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 8 }}>My Courses</h3>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {(courses || []).map((c) => (
              <Card key={c.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <strong>{c.title}</strong>
                  <div style={{ color: 'var(--muted-700)', fontSize: '0.95rem' }}>
                    {c.category ? c.category : 'General'} {c.level ? `• ${c.level}` : ''}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <Button as={Link} to={`/instructor/manage/${c.id}`} variant="ghost" size="sm">Manage</Button>
                    <Button as={Link} to={`/instructor/content/${c.id}`} variant="ghost" size="sm">Content</Button>
                    <Button as={Link} to={`/instructor/gradebook/${c.id}`} variant="primary" size="sm">Gradebook</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
