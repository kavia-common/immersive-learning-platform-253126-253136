import React, { useEffect, useMemo } from 'react';
import useAnalytics from '../../hooks/useAnalytics';
import '../../theme/global.css';

/**
 * PUBLIC_INTERFACE
 * AnalyticsDashboard
 * A lightweight analytics dashboard that renders CSS-based charts (bar, line, donut) without heavy dependencies.
 * Shows sample data and demonstrates how analytics could be displayed for admins.
 *
 * Styling follows the project's modern Ocean Professional theme using cards and subtle shadows.
 */
const AnalyticsDashboard = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView({ page: '/admin/analytics' });
  }, [trackPageView]);

  // Sample data - in a real app, this would come from API
  const metrics = useMemo(
    () => ({
      totals: {
        users: 1245,
        courses: 86,
        enrollments: 5930,
        completions: 3210,
      },
      enrollmentsByMonth: [
        { label: 'Jan', value: 220 },
        { label: 'Feb', value: 260 },
        { label: 'Mar', value: 300 },
        { label: 'Apr', value: 280 },
        { label: 'May', value: 340 },
        { label: 'Jun', value: 370 },
      ],
      completionsByCourse: [
        { label: 'React', value: 82 },
        { label: 'Python', value: 95 },
        { label: 'Design', value: 68 },
        { label: 'SQL', value: 74 },
        { label: 'JS', value: 91 },
      ],
      deviceSplit: [
        { label: 'Desktop', value: 62, color: '#2563EB' },
        { label: 'Mobile', value: 30, color: '#F59E0B' },
        { label: 'Tablet', value: 8, color: '#10B981' },
      ],
    }),
    []
  );

  const maxEnroll = Math.max(...metrics.enrollmentsByMonth.map(m => m.value)) || 1;
  const maxCompletion = Math.max(...metrics.completionsByCourse.map(m => m.value)) || 1;

  // Donut calculation
  const donutTotal = metrics.deviceSplit.reduce((a, b) => a + b.value, 0);
  let accumulated = 0;

  return (
    <div className="p-4 md:p-6" style={{ background: '#f9fafb' }}>
      <h1 className="text-2xl font-semibold mb-4" style={{ color: '#111827' }}>
        Analytics Dashboard
      </h1>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Users', value: metrics.totals.users },
          { label: 'Courses', value: metrics.totals.courses },
          { label: 'Enrollments', value: metrics.totals.enrollments },
          { label: 'Completions', value: metrics.totals.completions },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4"
            style={{
              background: '#ffffff',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
              border: '1px solid rgba(37,99,235,0.08)',
            }}
          >
            <div className="text-sm text-gray-500 mb-1">{card.label}</div>
            <div className="text-2xl font-bold" style={{ color: '#2563EB' }}>
              {card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Enrollments by Month */}
        <div
          className="rounded-xl p-4"
          style={{
            background: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
            border: '1px solid rgba(37,99,235,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: '#111827' }}>
              Enrollments by Month
            </h2>
          </div>
          <div className="flex items-end h-48 gap-3">
            {metrics.enrollmentsByMonth.map((m) => {
              const height = Math.max(6, (m.value / maxEnroll) * 100);
              return (
                <div key={m.label} className="flex flex-col items-center justify-end flex-1">
                  <div
                    title={`${m.label}: ${m.value}`}
                    style={{
                      height: `${height}%`,
                      width: '100%',
                      background:
                        'linear-gradient(180deg, rgba(37,99,235,0.9) 0%, rgba(37,99,235,0.5) 100%)',
                      borderRadius: '10px 10px 4px 4px',
                    }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line chart: Completions by Course (simple CSS line using gradient blocks) */}
        <div
          className="rounded-xl p-4"
          style={{
            background: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
            border: '1px solid rgba(37,99,235,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: '#111827' }}>
              Completions by Course
            </h2>
          </div>
          <div className="relative h-48">
            {/* baseline grid */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '100% 24px' }}></div>
            {/* pseudo line made by dots connected via angled borders */}
            <div className="absolute inset-3 flex items-end justify-between">
              {metrics.completionsByCourse.map((c, idx) => {
                const y = (c.value / maxCompletion) * 100;
                const isLast = idx === metrics.completionsByCourse.length - 1;
                const next = isLast ? null : metrics.completionsByCourse[idx + 1];
                const nextY = next ? (next.value / maxCompletion) * 100 : 0;
                const angle = next ? Math.atan((nextY - y) / 100) : 0;
                const length = next ? Math.sqrt((nextY - y) ** 2 + 100 ** 2) : 0;

                return (
                  <div key={c.label} className="relative" style={{ width: `${100 / metrics.completionsByCourse.length}%` }}>
                    <div
                      className="rounded-full"
                      style={{
                        position: 'absolute',
                        bottom: `calc(${y}% - 6px)`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 12,
                        height: 12,
                        backgroundColor: '#F59E0B',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                      }}
                      title={`${c.label}: ${c.value}`}
                    />
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `calc(${y}% - 1px)`,
                          left: '50%',
                          transformOrigin: 'left center',
                          transform: `translateX(0) rotate(${angle}rad)`,
                          width: `${length}%`,
                          height: 2,
                          background: 'linear-gradient(90deg, rgba(245,158,11,0.9) 0%, rgba(245,158,11,0.4) 100%)',
                        }}
                      />
                    )}
                    <div className="text-xs text-gray-500 absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      {c.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Donut chart: Device Split */}
        <div
          className="rounded-xl p-4"
          style={{
            background: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
            border: '1px solid rgba(37,99,235,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: '#111827' }}>
              Device Split
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div
              aria-label="Device usage donut chart"
              role="img"
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `conic-gradient(${metrics.deviceSplit
                  .map((segment) => {
                    const start = (accumulated / donutTotal) * 360;
                    accumulated += segment.value;
                    const end = (accumulated / donutTotal) * 360;
                    return `${segment.color} ${start}deg ${end}deg`;
                  })
                  .join(', ')})`,
                position: 'relative',
                boxShadow: 'inset 0 0 0 24px #fff, 0 8px 20px rgba(0,0,0,0.1)',
              }}
            />
            <div className="flex-1">
              <ul className="space-y-2">
                {metrics.deviceSplit.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      style={{ width: 12, height: 12, background: s.color, borderRadius: 2, display: 'inline-block' }}
                    />
                    <span className="text-sm text-gray-700">
                      {s.label}
                    </span>
                    <span className="text-sm text-gray-500 ml-auto">{s.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Table-style recent events (static demo) */}
      <div
        className="rounded-xl p-4 mt-6"
        style={{
          background: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(37,99,235,0.08)',
        }}
      >
        <h2 className="font-semibold mb-3" style={{ color: '#111827' }}>
          Recent Activity (demo)
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ts: '2025-01-05T10:10:12Z', ev: 'page_view', user: 'u_834', details: 'Visited /learn' },
                { ts: '2025-01-05T10:12:33Z', ev: 'course_enroll', user: 'u_834', details: 'Course React Basics' },
                { ts: '2025-01-05T10:59:02Z', ev: 'lesson_complete', user: 'u_912', details: 'Lesson 2: Components' },
              ].map((row, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-gray-600">{row.ts}</td>
                  <td className="py-2 pr-4">
                    <span
                      className="px-2 py-1 rounded-md"
                      style={{
                        background: 'rgba(37,99,235,0.08)',
                        color: '#2563EB',
                        fontWeight: 600,
                      }}
                    >
                      {row.ev}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{row.user}</td>
                  <td className="py-2 pr-4 text-gray-500">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
