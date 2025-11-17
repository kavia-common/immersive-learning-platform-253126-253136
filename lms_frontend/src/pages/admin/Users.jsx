import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { listUsers, setUserRole } from '../../lib/supabaseHelpers';
import { useUI } from '../../state/UIContext';

/**
 * Admin Users page: search, list and role assignment.
 */
 // PUBLIC_INTERFACE
export default function AdminUsers() {
  /** Admin page to list users and update roles. */
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const { addToast } = useUI();

  const load = async () => {
    setLoading(true);
    const { data, error } = await listUsers({ q });
    if (error) {
      addToast({ title: 'Failed to load users', message: error.message || 'Error' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const onSetRole = async (id, role) => {
    const { error } = await setUserRole(id, role);
    if (error) {
      addToast({ title: 'Update failed', message: error.message || 'Could not change role' });
    } else {
      addToast({ title: 'Role updated', message: 'User role changed' });
      load();
    }
  };

  return (
    <div className="container" aria-labelledby="users-heading">
      <h1 id="users-heading" className="page-title">Users</h1>
      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} aria-label="Search users form">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Input id="search-users" label="Search" placeholder="name or email" value={q} onChange={(e) => setQ(e.target.value)} />
              <Button variant="primary" type="submit" aria-label="Search users">Search</Button>
            </div>
          </form>
          <div role="table" aria-label="Users table" className="table-like">
            <div role="row" className="table-header">
              <div role="columnheader">Name</div>
              <div role="columnheader">Email</div>
              <div role="columnheader">Role</div>
              <div role="columnheader">Actions</div>
            </div>
            {loading ? <div role="row"><div role="cell">Loading…</div></div> : null}
            {!loading && items.map(u => (
              <div key={u.id} role="row" className="table-row">
                <div role="cell">{u.name || u.full_name || '—'}</div>
                <div role="cell">{u.email}</div>
                <div role="cell">{(u.roles && u.roles.join(', ')) || u.role || 'learner'}</div>
                <div role="cell" style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="ghost" onClick={() => onSetRole(u.id, 'learner')}>Learner</Button>
                  <Button size="sm" variant="ghost" onClick={() => onSetRole(u.id, 'instructor')}>Instructor</Button>
                  <Button size="sm" variant="primary" onClick={() => onSetRole(u.id, 'admin')}>Admin</Button>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 ? <div role="row"><div role="cell">No users found.</div></div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
