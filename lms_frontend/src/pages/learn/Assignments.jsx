import React, { useEffect, useRef, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { listLessons, uploadAssignment, listAssignments } from '../../lib/supabaseHelpers';

/**
 * Assignments
 * 
 * PUBLIC_INTERFACE
 * Lists assignments for a course and allows a learner to upload submission
 * via Supabase Storage with signed URLs.
 */
export default function Assignments() {
  const { id: courseId } = useParams();
  const { addToast } = useUI();

  const [assignments, setAssignments] = useState([]); // [{ id, title, description, lesson_id, due_at, submission?: {...} }]
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef({}); // assignmentId -> input ref

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [lRes, aRes] = await Promise.all([
          listLessons(courseId),
          listAssignments(courseId),
        ]);
        if (!mounted) return;
        if (aRes.error) {
          addToast({ title: 'Load error', message: 'Could not load assignments', variant: 'error' });
          setAssignments([]);
        } else {
          setAssignments(aRes.data || []);
        }
      } catch (e) {
        logger.error('Assignments init failed', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load assignments', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, addToast]);

  const handleUpload = async (assignmentId) => {
    const file = fileRefs.current[assignmentId]?.files?.[0];
    if (!file) {
      addToast({ title: 'No file selected', message: 'Choose a file to upload.' });
      return;
    }
    const { error } = await uploadAssignment(assignmentId, file);
    if (error) {
      addToast({ title: 'Upload failed', message: error.message || 'Try again.', variant: 'error' });
      return;
    }
    addToast({ title: 'Uploaded', message: 'Submission uploaded successfully.', variant: 'success' });
    const aRes = await listAssignments(courseId);
    if (!aRes.error) setAssignments(aRes.data || []);
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Assignments</h2>
        <p style={{ color: 'var(--muted-700)' }}>Upload your work. Supported types depend on course settings.</p>
      </Card>

      <div style={{ display: 'grid', gap: 10 }}>
        {(assignments || []).map((a) => (
          <Card key={a.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{a.title}</strong>
                <div style={{ color: 'var(--muted-700)' }}>
                  {a.due_at ? `Due: ${new Date(a.due_at).toLocaleString()}` : 'No due date'}
                </div>
              </div>
              <p style={{ color: 'var(--muted-700)' }}>{a.description}</p>
              <div>
                <input
                  ref={(el) => { fileRefs.current[a.id] = el; }}
                  aria-label={`Upload submission for ${a.title}`}
                  type="file"
                  className="oui-input"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button variant="primary" onClick={() => handleUpload(a.id)}>Upload</Button>
                </div>
              </div>
              {a.submission ? (
                <div className="card" style={{ padding: 10 }}>
                  <div style={{ color: 'var(--muted-700)' }}>
                    Submitted: {new Date(a.submission.created_at).toLocaleString()}
                  </div>
                  {a.submission.file_url ? (
                    <a href={a.submission.file_url} className="nav-link" target="_blank" rel="noreferrer" style={{ padding: 0 }}>
                      View submission
                    </a>
                  ) : null}
                  {a.submission.score != null ? (
                    <div>Score: <strong>{a.submission.score}</strong></div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
