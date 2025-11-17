import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { enrollInCourse, getCourseById } from '../lib/supabaseHelpers';
import { logger } from '../lib/logger';
import { useUI } from '../state/UIContext';
import { useAuth } from '../state/AuthContext';
import { getConfig } from '../lib/config';

// PUBLIC_INTERFACE
export default function CourseDetails() {
  /**
   * Course details page showing metadata and allowing enrollment.
   * Payment flow is feature-flagged via REACT_APP_FEATURE_FLAGS with 'payments' key.
   */
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, openModal } = useUI();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCourseById(id).then((res) => {
      if (!mounted) return;
      if (res.error) {
        logger.warn('CourseDetails load failed', { err: res.error?.message, id });
        addToast({ title: 'Not found', message: 'Course could not be loaded.', variant: 'warning' });
        navigate('/marketplace', { replace: true });
      } else {
        setCourse(res.data);
      }
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id, navigate, addToast]);

  const onEnroll = async () => {
    if (!user) {
      navigate('/signin', { state: { from: `/marketplace/${id}` } });
      return;
    }
    setEnrolling(true);
    try {
      const { status, error } = await enrollInCourse(id);
      if (error) {
        addToast({ title: 'Enrollment failed', message: error.message || 'Please try again.', variant: 'error' });
        return;
      }

      const cfg = getConfig();
      const paymentsEnabled = !!(cfg.features && (cfg.features.payments || cfg.features.payment));

      if (paymentsEnabled && status === 'pending') {
        // Payment stub modal
        openModal({
          title: 'Proceed to Payment',
          content: (
            <div style={{ display: 'grid', gap: 10 }}>
              <p style={{ color: 'var(--muted-700)' }}>
                Payments are enabled via feature flag. This is a demo payment step.
              </p>
              <p style={{ color: 'var(--muted-700)' }}>
                After successful payment, your enrollment will be confirmed.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="ghost" onClick={() => window.history.back()}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // In a real flow, redirect to payment provider.
                    addToast({ title: 'Payment simulated', message: 'Enrollment will be confirmed shortly.', variant: 'success' });
                    navigate('/learn');
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )
        });
        addToast({ title: 'Enrollment started', message: 'Complete payment to finish enrollment.' });
      } else {
        addToast({ title: 'Enrolled', message: 'You are now enrolled!', variant: 'success' });
        navigate('/learn');
      }
    } catch (e) {
      logger.error('onEnroll unexpected', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to enroll right now.', variant: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }
  if (!course) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>{course.title}</h2>
            <div style={{ color: 'var(--muted-700)' }}>
              {course.instructor_name ? `By ${course.instructor_name}` : null}
              {course.category ? ` • ${course.category}` : null}
              {course.level ? ` • ${course.level}` : null}
            </div>
            <p style={{ color: 'var(--muted-700)', marginTop: 12 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button as={Link} to="/marketplace" variant="ghost">Back to catalog</Button>
              <Button variant="primary" onClick={onEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling…' : 'Enroll'}
              </Button>
            </div>
          </div>
          <div>
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt=""
                style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)' }}
              />
            ) : (
              <Card className="card" style={{ padding: 12 }}>
                <p style={{ color: 'var(--muted-700)' }}>No preview available</p>
              </Card>
            )}
            <Card className="card" style={{ padding: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{course.price != null ? `$${Number(course.price).toFixed(2)}` : 'Free'}</strong>
                <Button variant="primary" size="sm" onClick={onEnroll} disabled={enrolling}>
                  {enrolling ? 'Enrolling…' : 'Enroll now'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
