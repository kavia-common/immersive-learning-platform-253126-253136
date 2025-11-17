import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { fetchLessonContent, listLessons, saveProgress, subscribeLessonUpdates } from '../../lib/supabaseHelpers';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * LessonViewer
 * 
 * PUBLIC_INTERFACE
 * Displays lesson content (video, markdown, html), auto-saves progress,
 * and optionally subscribes to realtime lesson updates when feature flag 'realtime' is enabled.
 */
export default function LessonViewer() {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const enableRealtime = useFeatureFlag('realtime');

  const [lessons, setLessons] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState(0); // seconds
  const [completed, setCompleted] = useState(false);
  const unsubRef = useRef(null);
  const { trackPageView } = useAnalytics();

  const currentIndex = useMemo(
    () => (lessons || []).findIndex((l) => String(l.id) === String(lessonId)),
    [lessons, lessonId]
  );

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [lRes, cRes] = await Promise.all([
          listLessons(courseId),
          fetchLessonContent(lessonId),
        ]);
        if (!mounted) return;
        if (lRes.error) {
          addToast({ title: 'Load error', message: 'Could not load lessons', variant: 'error' });
          setLessons([]);
        } else {
          setLessons(lRes.data || []);
          // Initialize from progress if present
          const prog = (lRes.progress || []).find(p => String(p.lesson_id) === String(lessonId));
          if (prog) {
            setPosition(Number(prog.last_position || 0));
            setCompleted(!!prog.completed);
          }
        }
        if (cRes.error) {
          addToast({ title: 'Load error', message: 'Could not load lesson content', variant: 'error' });
          setContent(null);
        } else {
          setContent(cRes.data || null);
        }
        try { trackPageView({ page: `/learn/${courseId}/lessons/${lessonId}`, courseId, lessonId }); } catch (_) {}
      } catch (e) {
        logger.error('LessonViewer init failed', { err: e?.message, courseId, lessonId });
        addToast({ title: 'Error', message: 'Unable to load lesson right now.', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!enableRealtime) return;
    // Optional realtime subscription for lesson updates
    unsubRef.current = subscribeLessonUpdates(lessonId, (payload) => {
      // For demo: notify about updates
      addToast({ title: 'Lesson updated', message: `Lesson content updated (${payload?.eventType})` });
    });
    return () => {
      try { unsubRef.current?.(); } catch (_) {}
    };
  }, [enableRealtime, lessonId, addToast]);

  // Simulate tracking time spent reading/watching; auto-save on interval
  useEffect(() => {
    const iv = setInterval(async () => {
      if (loading) return;
      setSaving(true);
      try {
        await saveProgress(lessonId, { last_position: position, completed });
      } finally {
        setSaving(false);
      }
      // bump position as a simulation
      setPosition((p) => p + 5);
    }, 5000);
    return () => clearInterval(iv);
  }, [lessonId, loading, position, completed]);

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{content?.title || 'Lesson'}</h2>
            <div style={{ color: 'var(--muted-700)' }}>
              {saving ? 'Saving progress…' : `Position: ${Math.round(position)}s`}{completed ? ' • Completed' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" as={Link} to={`/learn/${courseId}`}>Back to course</Button>
            <Button
              variant="subtle"
              onClick={async () => {
                setCompleted((c) => !c);
                setSaving(true);
                try {
                  await saveProgress(lessonId, { completed: !completed, last_position: position });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {completed ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        {/* Basic content rendering (safe preview); production should sanitize/whitelist */}
        {content?.video_url ? (
          <video
            key={content.video_url}
            src={content.video_url}
            controls
            style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)' }}
            onTimeUpdate={(e) => {
              const t = e?.target?.currentTime || 0;
              setPosition(Math.floor(t));
            }}
          />
        ) : null}
        {content?.html ? (
          <div
            style={{ marginTop: 12, color: 'var(--muted-700)' }}
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        ) : null}
        {content?.markdown && !content?.html ? (
          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--muted-700)' }}>{content.markdown}</pre>
        ) : null}
        {!content?.video_url && !content?.html && !content?.markdown ? (
          <p style={{ color: 'var(--muted-700)' }}>No content provided.</p>
        ) : null}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {prevLesson ? (
            <Button variant="ghost" onClick={() => navigate(`/learn/${courseId}/lessons/${prevLesson.id}`)}>
              ← Previous
            </Button>
          ) : <span aria-hidden="true" />}
        </div>
        <div>
          {nextLesson ? (
            <Button variant="primary" onClick={() => navigate(`/learn/${courseId}/lessons/${nextLesson.id}`)}>
              Next →
            </Button>
          ) : (
            <Button variant="primary" as={Link} to={`/learn/${courseId}/certificate`}>View Certificate</Button>
          )}
        </div>
      </div>
    </div>
  );
}
