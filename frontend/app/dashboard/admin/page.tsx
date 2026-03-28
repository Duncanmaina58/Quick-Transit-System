/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

const S = {
  page: {
    padding: '32px 36px',
    maxWidth: 1400,
  } as React.CSSProperties,
  header: {
    marginBottom: 32,
  } as React.CSSProperties,
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#e2e8f0',
    letterSpacing: '-0.5px',
    fontFamily: 'Sora, sans-serif',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'DM Mono, monospace',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 32,
  } as React.CSSProperties,
  statCard: {
    background: '#161b26',
    border: '1px solid #1e2535',
    borderRadius: 12,
    padding: '20px 22px',
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties,
  statLabel: {
    fontSize: 10,
    fontFamily: 'DM Mono, monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    fontFamily: 'DM Mono, monospace',
    lineHeight: 1,
    marginBottom: 6,
  } as React.CSSProperties,
  statSub: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'DM Mono, monospace',
  } as React.CSSProperties,
  section: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 24,
  } as React.CSSProperties,
  card: {
    background: '#161b26',
    border: '1px solid #1e2535',
    borderRadius: 12,
    overflow: 'hidden',
  } as React.CSSProperties,
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #1e2535',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
    fontFamily: 'Sora, sans-serif',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '10px 20px',
    textAlign: 'left' as const,
    fontSize: 10,
    fontFamily: 'DM Mono, monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    color: '#64748b',
    borderBottom: '1px solid #1e2535',
  },
  td: {
    padding: '11px 20px',
    fontSize: 13,
    color: '#e2e8f0',
    borderBottom: '1px solid rgba(30,37,53,0.6)',
    fontFamily: 'Sora, sans-serif',
  },
};

const STATS = [
  { key: 'saccos',    label: 'Total SACCOs',   color: '#f59e0b', icon: '🏢' },
  { key: 'users',     label: 'Registered Users',color: '#3b82f6', icon: '👥' },
  { key: 'vehicles',  label: 'Fleet Vehicles',  color: '#10b981', icon: '🚌' },
  { key: 'trips',     label: 'Trips Today',     color: '#8b5cf6', icon: '🛣️' },
  { key: 'violations',label: 'Violations (30d)', color: '#ef4444', icon: '⚠️' },
  { key: 'routes',    label: 'Active Routes',   color: '#06b6d4', icon: '📍' },
];

export default function AdminDashboardPage() {
  const [now, setNow] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleString('en-KE', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch real data
  const { data: saccosData } = useQuery({
    queryKey: ['admin-saccos-summary'],
    queryFn: () => adminApi.getSaccos({ page: 1, pageSize: 5 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-summary'],
    queryFn: () => adminApi.getAllUsers({ page: 1, pageSize: 5 }),
  });

  const saccos  = saccosData?.data;
  const users   = usersData?.data;

  const statValues: Record<string, number | string> = {
    saccos:     saccos?.totalCount ?? '—',
    users:      users?.totalCount  ?? '—',
    vehicles:   '—',
    trips:      '—',
    violations: '—',
    routes:     '—',
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={S.title}>Control Centre</h1>
            <p style={S.subtitle}>System-wide overview — QuickTransit Admin</p>
          </div>
          <div style={{
            padding: '8px 14px',
            background: '#161b26',
            border: '1px solid #1e2535',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'DM Mono, monospace',
            color: '#64748b',
          }}>
            {now}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={S.statsGrid}>
        {STATS.map((s, i) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={statValues[s.key]}
            color={s.color}
            icon={s.icon}
            delay={i * 60}
          />
        ))}
      </div>

      {/* Recent tables */}
      <div style={S.section}>
        {/* Recent SACCOs */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Recent SACCOs</span>
            <a href="/dashboard/admin/saccos" style={{ fontSize: 11, color: '#f59e0b', textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}>
              View all →
            </a>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Reg No.</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {saccos?.data?.length ? saccos.data.map((s: any) => (
                <tr key={s.id}>
                  <td style={S.td}>{s.name}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{s.registrationNumber}</td>
                  <td style={S.td}><StatusBadge active={s.isActive} /></td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ ...S.td, color: '#64748b', textAlign: 'center', padding: '24px' }}>No SACCOs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Users */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Recent Users</span>
            <a href="/dashboard/admin/users" style={{ fontSize: 11, color: '#f59e0b', textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}>
              View all →
            </a>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users?.data?.length ? users.data.map((u: any) => (
                <tr key={u.id}>
                  <td style={S.td}>
                    <div>{u.fullName}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'DM Mono, monospace' }}>{u.employeeId}</div>
                  </td>
                  <td style={S.td}><RoleBadge role={u.role} /></td>
                  <td style={S.td}><StatusBadge active={u.isActive} /></td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ ...S.td, color: '#64748b', textAlign: 'center', padding: '24px' }}>No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System health strip */}
      <div style={{
        background: '#161b26',
        border: '1px solid #1e2535',
        borderRadius: 12,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}>
        <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>System Status</span>
        {[
          { label: 'API',      ok: true },
          { label: 'Database', ok: true },
          { label: 'Email',    ok: true },
          { label: 'Auth',     ok: true },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.ok ? '#10b981' : '#ef4444' }} />
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: s.ok ? '#10b981' : '#ef4444' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, delay }: {
  label: string; value: number | string; color: string; icon: string; delay: number;
}) {
  return (
    <div style={{
      ...S.statCard,
      animation: `fadeUp 0.4s ease ${delay}ms both`,
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {/* accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '12px 12px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={S.statLabel}>{label}</div>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statSub}>registered in system</div>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    admin:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
    manager:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
    driver:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    conductor: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
    ntsa:      { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  };
  const style = map[role] ?? { bg: 'rgba(100,116,139,0.12)', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 10,
      fontFamily: 'DM Mono, monospace',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: style.bg,
      color: style.color,
    }}>{role}</span>
  );
}