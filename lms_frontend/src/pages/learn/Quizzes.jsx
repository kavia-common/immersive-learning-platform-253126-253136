import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { listQuizzes, submitQuiz } from '../../lib/supabaseHelpers';

/**
 * Quizzes
 * 
 * PUBLIC_INTERFACE
 * Lists quizzes for a course, renders questions for a selected quiz,
 * and submits answers to be scored.
 */
export default function Quizzes() {
  const { id: courseId } = useParams();
  const { addToast } = useUI();

  const [quizzes, setQuizzes] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await listQuizzes(courseId);
        if (!mounted) return;
        if (res.error) {
          addToast({ title: 'Load error', message: 'Could not load quizzes', variant: 'error' });
          setQuizzes([]);
        } else {
          setQuizzes(res.data || []);
        }
      } catch (e) {
        logger.error('Quizzes init failed', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load quizzes', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, addToast]);

  const activeQuiz = quizzes.find((q) => String(q.id) === String(activeQuizId));

  const onSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { data, error } = await submitQuiz(activeQuiz.id, answers);
      if (error) {
        addToast({ title: 'Submit failed', message: error.message || 'Try again.', variant: 'error' });
      } else {
        setResult(data || null);
        addToast({ title: 'Submitted', message: 'Your quiz has been graded.', variant: 'success' });
      }
    } catch (e) {
      logger.error('submitQuiz unexpected', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to submit quiz.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Quizzes</h2>
        <div style={{ color: 'var(--muted-700)' }}>
          Test your understanding of the material.
        </div>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(quizzes || []).map((q) => (
            <Button
              key={q.id}
              variant={String(activeQuizId) === String(q.id) ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveQuizId(q.id);
                setAnswers({});
                setResult(null);
              }}
            >
              {q.title || `Quiz ${q.id}`}
            </Button>
          ))}
        </div>
      </Card>

      {activeQuiz ? (
        <Card className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 8 }}>{activeQuiz.title}</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {(activeQuiz.questions || []).map((qn, idx) => (
              <div key={qn.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{idx + 1}. {qn.prompt}</div>
                <div role="group" aria-label={`Question ${idx + 1}`} style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  {(qn.options || []).map((opt) => (
                    <label key={opt.value} className="oui-label" style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`q-${qn.id}`}
                        value={opt.value}
                        checked={answers[qn.id] === opt.value}
                        onChange={(e) => setAnswers((a) => ({ ...a, [qn.id]: e.target.value }))}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="primary" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </Button>
          </div>
          {result ? (
            <div className="card" style={{ padding: 12, marginTop: 10 }}>
              <strong>Score: {result.score} / {result.total}</strong>
              {result.passed != null ? (
                <div style={{ color: 'var(--muted-700)' }}>{result.passed ? 'Passed' : 'Not passed'}</div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
