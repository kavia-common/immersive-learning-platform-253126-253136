import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { listLessons, postDiscussion, replyDiscussion, listDiscussions, subscribeDiscussionUpdates } from '../../lib/supabaseHelpers';

/**
 * Discussions
 * 
 * PUBLIC_INTERFACE
 * A simple discussion board per course with threads and replies.
 * Optional realtime updates controlled by 'realtime' feature flag.
 */
export default function Discussions() {
  const { id: courseId } = useParams();
  const { addToast } = useUI();
  const realtime = useFeatureFlag('realtime');

  const [lessons, setLessons] = useState([]);
  const [threads, setThreads] = useState([]); // [{ id, lesson_id, title, body, created_by, created_at, replies: [] }]
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyMap, setReplyMap] = useState({}); // threadId -> reply text

  useEffect(() => {
    let unsub = null;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [lRes, dRes] = await Promise.all([
          listLessons(courseId),
          listDiscussions(courseId),
        ]);
        if (!mounted) return;
        if (!lRes.error) setLessons(lRes.data || []);
        if (dRes.error) {
          addToast({ title: 'Load error', message: 'Could not load discussions', variant: 'error' });
          setThreads([]);
        } else {
          setThreads(dRes.data || []);
        }
      } catch (e) {
        logger.error('Discussions init failed', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load discussions', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }

      if (realtime) {
        unsub = subscribeDiscussionUpdates(courseId, (payload) => {
          // naive reload
          listDiscussions(courseId).then((res) => {
            if (!res.error && mounted) setThreads(res.data || []);
          }).catch(() => {});
        });
      }
    })();

    return () => {
      mounted = false;
      try { unsub?.(); } catch (_) {}
    };
  }, [courseId, addToast, realtime]);

  const onCreate = async () => {
    if (!newTitle || !newBody) {
      addToast({ title: 'Missing info', message: 'Title and body are required.' });
      return;
    }
    const { error } = await postDiscussion({ courseId, title: newTitle, body: newBody });
    if (error) {
      addToast({ title: 'Post failed', message: error.message || 'Try again.', variant: 'error' });
      return;
    }
    setNewTitle('');
    setNewBody('');
    const dRes = await listDiscussions(courseId);
    if (!dRes.error) setThreads(dRes.data || []);
  };

  const onReply = async (threadId) => {
    const text = replyMap[threadId];
    if (!text) return;
    const { error } = await replyDiscussion(threadId, text);
    if (error) {
      addToast({ title: 'Reply failed', message: error.message || 'Try again.', variant: 'error' });
      return;
    }
    setReplyMap((m) => ({ ...m, [threadId]: '' }));
    const dRes = await listDiscussions(courseId);
    if (!dRes.error) setThreads(dRes.data || []);
  };

  if (loading) {
    return <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Discussions</h2>
        <p style={{ color: 'var(--muted-700)' }}>
          Ask questions and collaborate with peers. Be respectful and constructive.
        </p>
      </Card>

      <Card className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Start a new thread</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="oui-field">
            <label htmlFor="new-body" className="oui-label">Body</label>
            <textarea id="new-body" className="oui-input" rows={4} value={newBody} onChange={(e) => setNewBody(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={onCreate}>Post</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 10 }}>
        {(threads || []).map((t) => (
          <Card key={t.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <strong>{t.title}</strong>
                <div style={{ color: 'var(--muted-700)' }}>{t.created_by_email || t.created_by || 'User'}</div>
              </div>
              <p style={{ color: 'var(--muted-700)' }}>{t.body}</p>
              <div aria-label="Replies" style={{ display: 'grid', gap: 6 }}>
                {(t.replies || []).map((r) => (
                  <div key={r.id} className="card" style={{ padding: 10 }}>
                    <div style={{ color: 'var(--muted-700)', fontSize: '0.95rem' }}>
                      {r.created_by_email || r.created_by || 'User'}
                    </div>
                    <div>{r.body}</div>
                  </div>
                ))}
              </div>
              <div className="oui-field">
                <label className="oui-label" htmlFor={`reply-${t.id}`}>Reply</label>
                <textarea
                  id={`reply-${t.id}`}
                  className="oui-input"
                  rows={2}
                  value={replyMap[t.id] || ''}
                  onChange={(e) => setReplyMap((m) => ({ ...m, [t.id]: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => onReply(t.id)}>Reply</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
