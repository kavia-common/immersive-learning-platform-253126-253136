import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../state/AuthContext';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { getConfig } from '../../lib/config';
import { getCourseById } from '../../lib/supabaseHelpers';
import { listLessons, saveProgress } from '../../lib/supabaseHelpers';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * CoursePlayer
 * 
 * PUBLIC_INTERFACE
 * High-level player page showing course overview and lesson list with progress.
 * - Lists lessons for a course
 * - Allows resuming last progress
 * - Links to lesson viewer
 */
export default function CoursePlayer() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useUI();
  const { trackPageView, trackEvent } = useAnalytics();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({}); // lesson_id -> { completed, last_position }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cRes, lRes] = await Promise.all([
          getCourseById(courseId),
          listLessons(courseId)
        ]);
        try { trackPageView({ page: `/learn/${courseId}`, courseId }); } catch (_) {}
        if (!mounted) return;
        if (cRes.error) {
          addToast({ title: 'Not found', message: 'Course not found', variant: 'warning' });
          navigate('/learn', { replace: true });
          return;
        }
        setCourse(cRes.data);
        if (lRes.error) {
          addToast({ title: 'Load error', message: 'Could not load lessons', variant: 'error' });
          setLessons([]);
        } else {
          setLessons(lRes.data || []);
          // build progress map from lRes.progress if present
          const map = {};
          (lRes.progress || []).forEach((p) => { map[p.lesson_id] = p; });
          setProgressMap(map);
        }
      } catch (e) {
        logger.error('CoursePlayer init failed', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load course right now.', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, navigate, addToast]);

  const completedCount = useMemo(
    () => (lessons || []).filter(l => progressMap[l.id]?.completed).length,
    [lessons, progressMap]
  );

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }
  if (!course) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <h2 style={{ marginBottom: 0 }}>{course.title}</h2>
          <p style={{ color: 'var(--muted-700)' }}>
            {course.description}
          </p>
          <div style={{ color: 'var(--muted-700)', display: 'flex', gap: 12 }}>
            <span>{completedCount}/{lessons.length} completed</span>
            {course.level ? <span>• {course.level}</span> : null}
            {course.category ? <span>• {course.category}</span> : null}
          </div>
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Lessons</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(lessons || []).map((l, idx) => {
            const prog = progressMap[l.id];
            const completed = !!prog?.completed;
            const lastPos = prog?.last_position != null ? Math.round(prog.last_position) : null;
            return (
              <li key={l.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--glass-border)', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: completed ? 'var(--color-secondary)' : 'var(--glass-border)', display: 'inline-block' }} />
                    <strong>{l.title}</strong>
                  </div>
                  {l.summary ? <p style={{ color: 'var(--muted-700)', marginTop: 4 }}>{l.summary}</p> : null}
                  <div style={{ color: 'var(--muted-700)', fontSize: '0.9rem' }}>
                    {completed ? 'Completed' : (lastPos != null ? `Resume at ${lastPos}s` : 'Not started')}
                  </div>
                </div>
                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/learn/${courseId}/lessons/${l.id}`)}
                  >
                    {completed ? 'Review' : (lastPos != null ? 'Resume' : 'Start')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {user && lessons.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                // Mark first lesson started
                await saveProgress(lessons[0].id, { completed: false, last_position: 0 });
                navigate(`/learn/${courseId}/lessons/${lessons[0].id}`);
              } catch (e) {
                // ignore
              }
            }}
          >
            Start course
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const lessonId = lessons[0]?.id || 'demo-lesson';
              try { trackEvent('lesson_complete', { courseId, lessonId, progress: 100 }); } catch (_) {}
              addToast({ title: 'Tracked', message: 'Demo lesson_complete event sent.' });
            }}
          >
            Demo: Track lesson_complete
          </Button>
        </div>
      ) : null}
    </div>
  );
}
