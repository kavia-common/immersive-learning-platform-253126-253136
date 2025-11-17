import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useParams, Link } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { getCourseById, updateCourse, listModulesForCourse, createModule, reorderModules, createLesson } from '../../lib/supabaseHelpers';

// PUBLIC_INTERFACE
export default function ManageCourse() {
  /**
   * Manage course metadata, modules ordering, and quick lesson creation.
   */
  const { id: courseId } = useParams();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);

  const [modules, setModules] = useState([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonModuleId, setNewLessonModuleId] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cRes, mRes] = await Promise.all([
          getCourseById(courseId),
          listModulesForCourse(courseId),
        ]);
        if (!mounted) return;
        if (!cRes.error) setCourse(cRes.data || null);
        if (!mRes.error) setModules(mRes.data || []);
      } catch (e) {
        logger.error('ManageCourse init error', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load course', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, addToast]);

  const saveMeta = async () => {
    if (!course) return;
    setSavingMeta(true);
    try {
      const { error } = await updateCourse(courseId, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnail_url: course.thumbnail_url,
      });
      if (error) addToast({ title: 'Save failed', message: error.message || 'Try again.', variant: 'error' });
      else addToast({ title: 'Saved', message: 'Course updated', variant: 'success' });
    } finally {
      setSavingMeta(false);
    }
  };

  const addModule = async () => {
    if (!newModuleTitle) {
      addToast({ title: 'Missing title', message: 'Provide module title.' });
      return;
    }
    const { error } = await createModule(courseId, { title: newModuleTitle });
    if (error) {
      addToast({ title: 'Add failed', message: error.message || 'Try again.', variant: 'error' });
      return;
    }
    setNewModuleTitle('');
    const mRes = await listModulesForCourse(courseId);
    if (!mRes.error) setModules(mRes.data || []);
  };

  const moveModule = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= modules.length) return;
    const reordered = [...modules];
    const [m] = reordered.splice(index, 1);
    reordered.splice(target, 0, m);
    setModules(reordered);
    const { error } = await reorderModules(courseId, reordered.map((mod, i) => ({ id: mod.id, position: i + 1 })));
    if (error) {
      addToast({ title: 'Reorder failed', message: error.message || 'Try again.', variant: 'error' });
    } else {
      addToast({ title: 'Reordered', message: 'Module order updated', variant: 'success' });
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle || !newLessonModuleId) {
      addToast({ title: 'Missing info', message: 'Select module and enter a lesson title.' });
      return;
    }
    const { error } = await createLesson(courseId, newLessonModuleId, { title: newLessonTitle });
    if (error) {
      addToast({ title: 'Create failed', message: error.message || 'Try again.', variant: 'error' });
      return;
    }
    setNewLessonTitle('');
    addToast({ title: 'Lesson created', message: 'Use Content Builder to add content.', variant: 'success' });
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }
  if (!course) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Manage Course</h2>
        <div style={{ color: 'var(--muted-700)' }}>
          Edit course details and structure modules and lessons.
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Metadata</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input label="Title" value={course.title || ''} onChange={(e) => setCourse((c) => ({ ...c, title: e.target.value }))} />
          <div className="oui-field">
            <label className="oui-label" htmlFor="desc">Description</label>
            <textarea id="desc" className="oui-input" rows={4} value={course.description || ''} onChange={(e) => setCourse((c) => ({ ...c, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <Input label="Category" value={course.category || ''} onChange={(e) => setCourse((c) => ({ ...c, category: e.target.value }))} />
            <div className="oui-field">
              <label className="oui-label" htmlFor="level">Level</label>
              <select id="level" className="oui-input" value={course.level || ''} onChange={(e) => setCourse((c) => ({ ...c, level: e.target.value }))}>
                {['Beginner','Intermediate','Advanced'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <Input label="Price" type="number" step="0.01" value={course.price || 0} onChange={(e) => setCourse((c) => ({ ...c, price: e.target.value }))} />
          </div>
          <Input label="Thumbnail URL" value={course.thumbnail_url || ''} onChange={(e) => setCourse((c) => ({ ...c, thumbnail_url: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={saveMeta} disabled={savingMeta}>{savingMeta ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Modules</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <Input label="New module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <Button variant="ghost" onClick={addModule}>Add Module</Button>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(modules || []).map((m, idx) => (
              <li key={m.id} className="card" style={{ padding: 10, marginTop: idx === 0 ? 0 : 8, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{m.title}</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => moveModule(idx, -1)} disabled={idx === 0}>↑</Button>
                    <Button variant="ghost" size="sm" onClick={() => moveModule(idx, 1)} disabled={idx === modules.length - 1}>↓</Button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="oui-field">
                    <label className="oui-label" htmlFor={`lesson-${m.id}`}>Quick add lesson</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <input id={`lesson-${m.id}`} className="oui-input" placeholder="Lesson title" value={newLessonModuleId === m.id ? (newLessonTitle || '') : ''} onChange={(e) => { setNewLessonModuleId(m.id); setNewLessonTitle(e.target.value); }} />
                      <Button variant="ghost" onClick={addLesson}>Add</Button>
                    </div>
                  </div>
                  <div>
                    <Button as={Link} to={`/instructor/content/${courseId}?module=${m.id}`} variant="primary" size="sm">Open Content Builder</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
