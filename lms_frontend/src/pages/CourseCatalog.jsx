import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { listCourses } from '../lib/supabaseHelpers';
import { logger } from '../lib/logger';

const CATEGORIES = ['All', 'Development', 'Design', 'Marketing', 'Business', 'Data'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title_asc', label: 'Title A–Z' },
  { key: 'title_desc', label: 'Title Z–A' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
];

// PUBLIC_INTERFACE
export default function CourseCatalog() {
  /**
   * Course catalog marketplace with search, filter, sort, and paging.
   * Reads/writes URL search params for stateful navigation.
   */
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [count, setCount] = useState(0);

  const q = params.get('q') || '';
  const category = params.get('category') || 'All';
  const level = params.get('level') || 'All';
  const sort = params.get('sort') || 'newest';
  const page = parseInt(params.get('page') || '1', 10);
  const limit = 12;

  const filters = useMemo(() => ({
    q,
    category: category === 'All' ? '' : category,
    level: level === 'All' ? '' : level,
    sort,
    limit,
    page
  }), [q, category, level, sort, page]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listCourses(filters).then((res) => {
      if (!mounted) return;
      if (res.error) {
        logger.warn('CourseCatalog load failed', { err: res.error?.message });
        setCourses([]);
        setCount(0);
      } else {
        setCourses(res.data);
        setCount(res.count || 0);
      }
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(count / limit));

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value == null || value === '' || value === 'All') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page'); // reset paging on filter changes
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
        <Card className="card" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'end' }}>
            <Input
              label="Search"
              placeholder="Search courses"
              value={q}
              onChange={(e) => updateParam('q', e.target.value)}
            />
            <div className="oui-field">
              <label className="oui-label" htmlFor="category">Category</label>
              <select
                id="category"
                className="oui-input"
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="oui-field">
              <label className="oui-label" htmlFor="level">Level</label>
              <select
                id="level"
                className="oui-input"
                value={level}
                onChange={(e) => updateParam('level', e.target.value)}
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="oui-field">
              <label className="oui-label" htmlFor="sort">Sort by</label>
              <select
                id="sort"
                className="oui-input"
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <div role="status" aria-live="polite" style={{ minHeight: 24, color: 'var(--muted-700)' }}>
          {loading ? 'Loading courses…' : `${count} course${count === 1 ? '' : 's'} found`}
        </div>

        <div
          className="catalog-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12
          }}
        >
          {courses.map((c) => (
            <Card key={c.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt=""
                    style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)' }}
                  />
                ) : null}
                <h3 style={{ margin: 0 }}>{c.title}</h3>
                <div style={{ color: 'var(--muted-700)', fontSize: '0.95rem' }}>
                  {c.instructor_name ? `By ${c.instructor_name}` : null}
                  {c.category ? ` • ${c.category}` : null}
                  {c.level ? ` • ${c.level}` : null}
                </div>
                <p style={{ color: 'var(--muted-700)' }}>
                  {(c.description || '').slice(0, 120)}{(c.description || '').length > 120 ? '…' : ''}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{c.price != null ? `$${Number(c.price).toFixed(2)}` : 'Free'}</strong>
                  <Button as={Link} to={`/marketplace/${c.id}`} variant="primary" size="sm">
                    View details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <div style={{ color: 'var(--muted-700)' }}>
            Page {page} of {totalPages}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', Math.min(totalPages, page + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
