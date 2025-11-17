import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useUI } from '../../state/UIContext';
import { logger } from '../../lib/logger';
import { listModulesForCourse, listLessonsInModule, saveContent } from '../../lib/supabaseHelpers';

// PUBLIC_INTERFACE
export default function ContentBuilder() {
  /**
   * Content Builder for instructors to edit lesson content (video url, markdown, html).
   */
  const { id: courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useUI();

  const search = new URLSearchParams(location.search);
  const initialModule = search.get('module') || '';

  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState(initialModule);
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');
  const [form, setForm] = useState({ title: '', video_url: '', markdown: '', html: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedLesson = useMemo(() => lessons.find((l) => String(l.id) === String(lessonId)), [lessons, lessonId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const mRes = await listModulesForCourse(courseId);
        if (!mounted) return;
        if (mRes.error) {
          addToast({ title: 'Load failed', message: 'Could not load modules', variant: 'error' });
          setModules([]);
        } else {
          setModules(mRes.data || []);
          const mod = (mRes.data || [])[0];
          const useModuleId = initialModule || mod?.id || '';
          setModuleId(useModuleId);
          if (useModuleId) {
            const lRes = await listLessonsInModule(useModuleId);
            if (!lRes.error) setLessons(lRes.data || []);
          }
        }
      } catch (e) {
        logger.error('ContentBuilder init error', { err: e?.message, courseId });
        addToast({ title: 'Error', message: 'Unable to load content', variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, initialModule, addToast]);

  const loadLessons = async (modId) => {
    const res = await listLessonsInModule(modId);
    if (!res.error) setLessons(res.data || []);
    setLessonId('');
    setForm({ title: '', video_url: '', markdown: '', html: '' });
  };

  const onSelectLesson = (id) => {
    setLessonId(id);
    const l = lessons.find((x) => String(x.id) === String(id));
    if (l) {
      setForm({ title: l.title || '', video_url: l.video_url || '', markdown: l.markdown || '', html: l.html || '' });
    }
  };

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSave = async () => {
    if (!lessonId) {
      addToast({ title: 'No lesson selected', message: 'Choose a lesson first.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await saveContent(lessonId, {
        title: form.title || null,
        video_url: form.video_url || null,
        markdown: form.markdown || null,
        html: form.html || null
      });
      if (error) addToast({ title: 'Save failed', message: error.message || 'Try again.', variant: 'error' });
      else addToast({ title: 'Saved', message: 'Lesson content updated.', variant: 'success' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card className="card" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Content Builder</h2>
        <div style={{ color: 'var(--muted-700)' }}>
          Select a module and lesson to edit content. Use video url, markdown or HTML.
        </div>
      </Card>

      {loading ? (
        <Card className="card" style={{ padding: 16 }}><p>Loading…</p></Card>
      ) : (
        <Card className="card" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <div className="oui-field">
              <label className="oui-label" htmlFor="module">Module</label>
              <select
                id="module"
                className="oui-input"
                value={moduleId}
                onChange={async (e) => {
                  const mod = e.target.value;
                  setModuleId(mod);
                  await loadLessons(mod);
                }}
              >
                <option value="">Select module</option>
                {(modules || []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="oui-field">
              <label className="oui-label" htmlFor="lesson">Lesson</label>
              <select id="lesson" className="oui-input" value={lessonId} onChange={(e) => onSelectLesson(e.target.value)}>
                <option value="">Select lesson</option>
                {(lessons || []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <Input label="Lesson Title" value={form.title} onChange={onChange('title')} />
            <Input label="Video URL" value={form.video_url} onChange={onChange('video_url')} />
            <div className="oui-field">
              <label className="oui-label" htmlFor="md">Markdown</label>
              <textarea id="md" className="oui-input" rows={6} value={form.markdown} onChange={onChange('markdown')} />
            </div>
            <div className="oui-field">
              <label className="oui-label" htmlFor="html">HTML</label>
              <textarea id="html" className="oui-input" rows={6} value={form.html} onChange={onChange('html')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
              <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save Content'}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
