import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { getCourseById, getCertificate } from '../../lib/supabaseHelpers';

/**
 * Certificates
 * 
 * PUBLIC_INTERFACE
 * Shows certificate for a completed course and provides a download link.
 */
export default function Certificates() {
  const { id: courseId } = useParams();
  const { addToast } = useUI();

  const [course, setCourse] = useState(null);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cRes, certRes] = await Promise.all([
          getCourseById(courseId),
          getCertificate(courseId)
        ]);
        if (!mounted) return;
        if (!cRes.error) setCourse(cRes.data || null);
        if (certRes.error) {
          addToast({ title: 'Not available', message: 'Certificate not available yet.' });
          setCert(null);
        } else {
          setCert(certRes.data || null);
        }
      } catch (e) {
        logger.error('Certificates init failed', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load certificate', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, addToast]);

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Certificate</h2>
        <div style={{ color: 'var(--muted-700)' }}>
          {course ? `Course: ${course.title}` : 'Course'}
        </div>
      </Card>
      <Card className="card" style={{ padding: 16 }}>
        {cert ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <img
              src={cert.preview_url}
              alt="Course completion certificate preview"
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)' }}
            />
            {cert.download_url ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button as="a" href={cert.download_url} target="_blank" rel="noreferrer" variant="primary">
                  Download
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-700)' }}>No certificate available yet. Complete all lessons and pass quizzes to unlock.</p>
        )}
      </Card>
    </div>
  );
}
