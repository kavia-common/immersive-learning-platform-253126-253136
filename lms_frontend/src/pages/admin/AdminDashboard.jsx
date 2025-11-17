import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

/**
 * AdminDashboard: Entry point for admin console with quick links.
 * Provides overview cards and navigation to admin sub-sections.
 */
 // PUBLIC_INTERFACE
export default function AdminDashboard() {
  /** Admin dashboard landing with quick actions. */
  const navigate = useNavigate();
  return (
    <div className="container" aria-labelledby="admin-heading">
      <h1 id="admin-heading" className="page-title">Admin Console</h1>
      <p className="muted">Manage users, courses, system settings, feature toggles, and audit logs.</p>
      <div className="grid grid-3">
        <Card>
          <div style={{ padding: 16 }}>
            <h2 className="card-title">Users</h2>
            <p className="muted">View and manage user roles.</p>
            <Button variant="primary" onClick={() => navigate('/admin/users')} aria-label="Manage Users">Open</Button>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <h2 className="card-title">Courses</h2>
            <p className="muted">Approve, disable, or review courses.</p>
            <Button variant="primary" onClick={() => navigate('/admin/courses')} aria-label="Manage Courses">Open</Button>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <h2 className="card-title">Settings</h2>
            <p className="muted">System preferences and configuration.</p>
            <Button variant="primary" onClick={() => navigate('/admin/settings')} aria-label="Open Settings">Open</Button>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <h2 className="card-title">Feature Toggles</h2>
            <p className="muted">Enable or disable experimental features.</p>
            <Button variant="primary" onClick={() => navigate('/admin/feature-toggles')} aria-label="Open Feature Toggles">Open</Button>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <h2 className="card-title">Audit Logs</h2>
            <p className="muted">Trace important admin actions.</p>
            <Button variant="primary" onClick={() => navigate('/admin/audit-logs')} aria-label="View Audit Logs">Open</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
