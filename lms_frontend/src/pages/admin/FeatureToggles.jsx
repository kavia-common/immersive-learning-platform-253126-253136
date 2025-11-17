import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FeatureFlagContext } from '../../state/FeatureFlagContext';
import { useContext } from 'react';

/**
 * Admin Feature Toggles: update in-memory flags for client session.
 */
 // PUBLIC_INTERFACE
export default function AdminFeatureToggles() {
  /** Admin page to adjust client-side feature flags at runtime (session-scoped). */
  const { flags, updateFlags } = useContext(FeatureFlagContext);
  const [local, setLocal] = useState(flags || {});
  const [newKey, setNewKey] = useState('');

  const onToggle = (k) => {
    const v = !local[k];
    const next = { ...local, [k]: v };
    setLocal(next);
  };

  const onApply = () => {
    updateFlags(local);
  };

  const onAdd = (e) => {
    e.preventDefault();
    const k = newKey.trim();
    if (!k) return;
    setLocal({ ...local, [k]: true });
    setNewKey('');
  };

  return (
    <div className="container" aria-labelledby="toggles-heading">
      <h1 id="toggles-heading" className="page-title">Feature Toggles</h1>
      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <form onSubmit={onAdd} aria-label="Add feature flag form">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Input id="new-flag" label="Add Flag" placeholder="flag_name" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              <Button type="submit" variant="ghost">Add</Button>
            </div>
          </form>
          <div role="list" aria-label="Feature flags list" className="list-like">
            {Object.keys(local).length === 0 ? <div role="listitem" className="muted">No flags defined.</div> : null}
            {Object.entries(local).map(([k, v]) => (
              <div key={k} role="listitem" className="list-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{k}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span aria-live="polite" className="muted">{v ? 'enabled' : 'disabled'}</span>
                  <Button size="sm" variant={v ? 'danger' : 'primary'} onClick={() => onToggle(k)}>
                    {v ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div>
            <Button variant="primary" onClick={onApply} aria-label="Apply feature flags">Apply</Button>
          </div>
          <p className="muted">Changes take effect immediately for this browser session.</p>
        </div>
      </Card>
    </div>
  );
}
