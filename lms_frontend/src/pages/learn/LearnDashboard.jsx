import React, { useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * LearnDashboard
 * 
 * PUBLIC_INTERFACE
 * Simple learner landing page with quick links.
 */
export default function LearnDashboard() {
  const { trackPageView } = useAnalytics();
  useEffect(() => {
    try { trackPageView({ page: '/learn' }); } catch (_) {}
  }, [trackPageView]);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Welcome to Learn</h2>
        <p style={{ color: 'var(--muted-700)' }}>
          Continue your learning journey. Choose a course, view lessons, participate in discussions, submit assignments, and take quizzes.
        </p>
      </Card>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        <Card className="card" style={{ padding: 16 }}>
          <h3>My Courses</h3>
          <p style={{ color: 'var(--muted-700)' }}>Browse your enrolled courses from the marketplace and start learning.</p>
          <Button as={Link} to="/marketplace" variant="primary">Find Courses</Button>
        </Card>
        <Card className="card" style={{ padding: 16 }}>
          <h3>Discussions</h3>
          <p style={{ color: 'var(--muted-700)' }}>Ask questions and collaborate with peers.</p>
          <Button as={Link} to="/learn/discussions" variant="ghost">Open Discussions</Button>
        </Card>
        <Card className="card" style={{ padding: 16 }}>
          <h3>Assignments</h3>
          <p style={{ color: 'var(--muted-700)' }}>Submit your work and track feedback.</p>
          <Button as={Link} to="/learn/assignments" variant="ghost">View Assignments</Button>
        </Card>
        <Card className="card" style={{ padding: 16 }}>
          <h3>Quizzes</h3>
          <p style={{ color: 'var(--muted-700)' }}>Evaluate your understanding with quizzes.</p>
          <Button as={Link} to="/learn/quizzes" variant="ghost">Take Quizzes</Button>
        </Card>
      </div>
    </div>
  );
}
