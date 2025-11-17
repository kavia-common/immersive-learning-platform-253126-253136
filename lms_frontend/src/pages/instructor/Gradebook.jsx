import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { getCourseById, listEnrollmentsForCourse, listGrades, setGrade } from '../../lib/supabaseHelpers';

// PUBLIC_INTERFACE
export default function Gradebook() {
  /**
   * Gradebook for an instructor to view enrollments and assign/update grades.
   */
  const { id: courseId } = useParams();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [rows, setRows] = useState([]); // [{ user_id, email, status, grade }]
  const [editMap, setEditMap] = useState({}); // user_id -> grade value
  const [saving, setSaving] = useState({}); // user_id -> bool

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cRes, eRes, gRes] = await Promise.all([
          getCourseById(courseId),
          listEnrollmentsForCourse(courseId),
          listGrades(courseId),
        ]);
        if (!mounted) return;
        if (!cRes.error) setCourse(cRes.data || null);
        const enrollments = eRes.error ? [] : (eRes.data || []);
        const grades = gRes.error ? [] : (gRes.data || []);
        const gradeMap = {};
        grades.forEach((g) => { gradeMap[g.user_id] = g.grade; });
        const merged = enrollments.map((en) => ({
          user_id: en.user_id,
          email: en.user_email || en.user_id,
          status: en.status,
          grade: gradeMap[en.user_id] ?? null,
        }));
        setRows(merged);
      } catch (e) {
        logger.error('Gradebook load error', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load gradebook', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, addToast]);

  const onSave = async (userId) => {
    const value = editMap[userId];
    if (value == null || value === '') {
      addToast({ title: 'Missing grade', message: 'Enter a grade value.' });
      return;
    }
    setSaving((s) => ({ ...s, [userId]: true }));
    try {
      const { error } = await setGrade(courseId, userId, value);
      if (error) {
        addToast({ title: 'Save failed', message: error.message || 'Try again.', variant: 'error' });
      } else {
        addToast({ title: 'Saved', message: 'Grade updated.', variant: 'success' });
        setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, grade: value } : r)));
      }
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Gradebook</h2>
        <div style={{ color: 'var(--muted-700)' }}>
          {course ? `Course: ${course.title}` : 'Course'}
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <div role="table" aria-label="Gradebook" style={{ display: 'grid', gap: 6 }}>
          <div role="row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, fontWeight: 700 }}>
            <div role="columnheader">Learner</div>
            <div role="columnheader">Status</div>
            <div role="columnheader">Grade</div>
            <div role="columnheader" />
          </div>
          {(rows || []).map((r) => (
            <div key={r.user_id} role="row" className="card" style={{ padding: 8, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
              <div role="cell" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
              <div role="cell">{r.status}</div>
              <div role="cell">
                <Input
                  label="Grade"
                  id={`grade-${r.user_id}`}
                  type="text"
                  value={editMap[r.user_id] != null ? editMap[r.user_id] : (r.grade ?? '')}
                  onChange={(e) => setEditMap((m) => ({ ...m, [r.user_id]: e.target.value }))}
                />
              </div>
              <div role="cell" style={{ display: 'flex', alignItems: 'end' }}>
                <Button variant="primary" size="sm" onClick={() => onSave(r.user_id)} disabled={!!saving[r.user_id]}>
                  {saving[r.user_id] ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
