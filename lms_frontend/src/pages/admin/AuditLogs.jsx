import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { listAuditLogs } from '../../lib/supabaseHelpers';
import { useUI } from '../../state/UIContext';

/**
 * Admin Audit Logs: view recent admin/system actions.
 */
 // PUBLIC_INTERFACE
export default function AdminAuditLogs() {
  /** Admin page to list audit trail entries ordered by newest. */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useUI();

  const load = async () => {
    setLoading(true);
    const { data, error } = await listAuditLogs({ limit: 100 });
    if (error) {
      addToast({ title: 'Failed to load logs', message: error.message || 'Error' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="container" aria-labelledby="audit-heading">
      <h1 id="audit-heading" className="page-title">Audit Logs</h1>
      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={load} aria-label="Refresh logs">Refresh</Button>
          </div>
          <div role="table" aria-label="Audit logs table" className="table-like">
            <div role="row" className="table-header">
              <div role="columnheader">Time</div>
              <div role="columnheader">Actor</div>
              <div role="columnheader">Action</div>
              <div role="columnheader">Target</div>
              <div role="columnheader">Details</div>
            </div>
            {loading ? <div role="row"><div role="cell">Loading…</div></div> : null}
            {!loading && items.map(log => (
              <div key={log.id} role="row" className="table-row">
                <div role="cell">{new Date(log.created_at).toLocaleString()}</div>
                <div role="cell">{log.actor_email || log.actor_id || 'system'}</div>
                <div role="cell">{log.action}</div>
                <div role="cell">{log.target || '—'}</div>
                <div role="cell">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 ? <div role="row"><div role="cell">No logs.</div></div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
