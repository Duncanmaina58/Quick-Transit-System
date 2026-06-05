/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { managerApi } from '@/lib/api/manager';
import { AuthService } from '@/lib/utils/auth';
import type { ManagerDashboardResponse, VehicleResponse, UserResponse } from '@/types/api';

const T = {
  bg: '#0d1b2a', surface: '#0a1628', card: '#0f2033',
  border: '#1e3a5f', teal: '#0891b2', tealDim: '#0e7490',
  text: '#e2eaf3', muted: '#5b7fa0', success: '#10b981',
  warning: '#f59e0b', danger: '#ef4444',
};

export default function ManagerDashboardPage() {
  const [now, setNow] = useState('');
  const user = AuthService.getUser();

  useEffect(() => {
    const fmt = () => new Date().toLocaleString('en-KE', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: () => managerApi.getDashboard(),
    refetchInterval: 60000, // refresh every minute
  });

  const dash: ManagerDashboardResponse | null = data?.data?.data ?? null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1320 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        a { text-decoration: none; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.3px' }}>
              {dash?.saccoName ?? 'My SACCO'}
            </h1>
            {dash?.registrationNumber && (
              <span style={{
                padding: '2px 8px', borderRadius: 20,
                background: 'rgba(8,145,178,0.12)', color: T.teal,
                fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 500,
                border: '1px solid rgba(8,145,178,0.25)',
              }}>
                {dash.registrationNumber}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: T.muted, fontFamily: 'IBM Plex Mono' }}>
            Manager Dashboard — {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dash?.maintenanceDue !== undefined && dash.maintenanceDue > 0 && (
            <div style={{
              padding: '7px 12px', borderRadius: 8,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 11, color: T.warning,
              fontFamily: 'IBM Plex Mono', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>⚠</span> {dash.maintenanceDue} vehicle{dash.maintenanceDue > 1 ? 's' : ''} due for service
            </div>
          )}
          <div style={{
            padding: '7px 12px', borderRadius: 8,
            background: T.card, border: `1px solid ${T.border}`,
            fontSize: 11, fontFamily: 'IBM Plex Mono', color: T.muted,
          }}>{now}</div>
        </div>
      </div>x

      {/* ── Stat cards grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Vehicles',    value: dash?.totalVehicles,    sub: `${dash?.activeVehicles ?? 0} active`,       color: T.teal,    icon: '🚌', link: '/dashboard/manager/vehicles' },
          { label: 'On Maintenance',    value: dash?.vehiclesOnMaintenance, sub: `${dash?.maintenanceDue ?? 0} due soon`, color: T.warning, icon: '🔧', link: '/dashboard/manager/vehicles?status=maintenance' },
          { label: 'Total Drivers',     value: dash?.totalDrivers,     sub: `${dash?.unassignedDrivers ?? 0} unassigned`, color: T.success, icon: '👤', link: '/dashboard/manager/crew?role=driver' },
          { label: 'Total Conductors',  value: dash?.totalConductors,  sub: `${dash?.unassignedConductors ?? 0} unassigned`, color: '#8b5cf6', icon: '🎫', link: '/dashboard/manager/crew?role=conductor' },
          { label: 'Active Routes',     value: dash?.totalRoutes,      sub: 'system-wide',                                color: '#06b6d4', icon: '📍', link: '/dashboard/manager/routes' },
          { label: 'Trips Today',       value: dash?.tripsToday,       sub: 'logged trips',                               color: '#10b981', icon: '🛣️', link: '/dashboard/manager/trips' },
          { label: 'Violations (MTD)',   value: dash?.violationsThisMonth, sub: 'this month',                             color: T.danger,  icon: '⚠️', link: '/dashboard/manager/violations' },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} loading={isLoading} delay={i * 50} />
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Add Vehicle',    href: '/dashboard/manager/vehicles?action=new',  icon: '🚌', color: T.teal },
          { label: 'Add Crew',       href: '/dashboard/manager/crew?action=new',      icon: '👤', color: '#8b5cf6' },
          { label: 'Assign Route',   href: '/dashboard/manager/vehicles',             icon: '📍', color: '#06b6d4' },
          { label: 'Log Trip',       href: '/dashboard/manager/trips?action=new',     icon: '🛣️', color: T.success },
        ].map(q => (
          <Link key={q.label} href={q.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10,
            background: T.card, border: `1px solid ${T.border}`,
            color: T.text, fontSize: 12, fontWeight: 600,
            transition: 'all 0.15s', cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color; (e.currentTarget as HTMLElement).style.background = `${T.surface}`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.background = T.card; }}
          >
            <span style={{ fontSize: 18 }}>{q.icon}</span>
            <span>{q.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Bottom grid ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Recent vehicles */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <SectionHeader title="Fleet Overview" link="/dashboard/manager/vehicles" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Plate', 'Make / Model', 'Driver', 'Route', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : dash?.recentVehicles?.length ? (
                dash.recentVehicles.map((v: VehicleResponse) => (
                  <tr key={v.id} style={{ borderBottom: `1px solid rgba(30,58,95,0.5)` }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.teal, fontWeight: 500 }}>{v.registrationPlate}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: T.text }}>{v.make} {v.model}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: T.muted }}>
                      {v.driverName ?? <span style={{ color: '#334155', fontFamily: 'IBM Plex Mono' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: T.muted }}>
                      {v.routeCode
                        ? <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontFamily: 'IBM Plex Mono', fontSize: 10 }}>{v.routeCode}</span>
                        : <span style={{ color: '#334155', fontFamily: 'IBM Plex Mono', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}><VehicleStatusBadge status={v.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: 'IBM Plex Mono' }}>No vehicles registered yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent crew */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <SectionHeader title="Crew Members" link="/dashboard/manager/crew" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Role', 'Employee ID', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : dash?.recentCrew?.length ? (
                dash.recentCrew.map((u: UserResponse) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid rgba(30,58,95,0.5)` }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={`${u.firstName} ${u.lastName}`} role={u.role} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 10, color: T.muted, fontFamily: 'IBM Plex Mono' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '10px 16px', fontFamily: 'IBM Plex Mono', fontSize: 10, color: T.teal }}>{u.employeeId}</td>
                    <td style={{ padding: '10px 16px' }}><StatusDot active={u.isActive} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: 'IBM Plex Mono' }}>No crew members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Assignment health ────────────────────────────────────────────────── */}
      {dash && (
        <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 14 }}>Fleet Assignment Health</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <ProgressBar
              label="Vehicles with Driver"
              value={dash.totalVehicles ? Math.round(((dash.totalDrivers - dash.unassignedDrivers) / Math.max(dash.totalVehicles, 1)) * 100) : 0}
              color={T.teal}
            />
            <ProgressBar
              label="Vehicles with Conductor"
              value={dash.totalVehicles ? Math.round(((dash.totalConductors - dash.unassignedConductors) / Math.max(dash.totalVehicles, 1)) * 100) : 0}
              color="#8b5cf6"
            />
            <ProgressBar
              label="Vehicles with Route"
              value={dash.totalVehicles ? Math.round(((dash.totalVehicles - (dash.unassignedDrivers ?? 0)) / Math.max(dash.totalVehicles, 1)) * 100) : 0}
              color="#06b6d4"
            />
            <ProgressBar
              label="Fleet Active"
              value={dash.totalVehicles ? Math.round((dash.activeVehicles / Math.max(dash.totalVehicles, 1)) * 100) : 0}
              color={T.success}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon, link, loading, delay }: {
  label: string; value?: number; sub: string; color: string;
  icon: string; link: string; loading: boolean; delay: number;
}) {
  return (
    <Link href={link} style={{
      display: 'block',
      background: '#0f2033',
      border: '1px solid #1e3a5f',
      borderRadius: 11, padding: '16px 18px',
      position: 'relative', overflow: 'hidden',
      animation: `fadeUp 0.35s ease ${delay}ms both`,
      textDecoration: 'none', transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = color}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e3a5f'}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '11px 11px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: '#5b7fa0' }}>{label}</div>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      {loading ? (
        <div style={{ height: 28, width: 60, borderRadius: 4, background: '#1e3a5f', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'IBM Plex Mono', color, lineHeight: 1, marginBottom: 4 }}>
          {value ?? '—'}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#5b7fa0', fontFamily: 'IBM Plex Mono' }}>{sub}</div>
    </Link>
  );
}

function SectionHeader({ title, link }: { title: string; link: string }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf3' }}>{title}</span>
      <Link href={link} style={{ fontSize: 10, color: '#0891b2', fontFamily: 'IBM Plex Mono' }}>View all →</Link>
    </div>
  );
}

function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active:      { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
    Maintenance: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
    Inactive:    { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
    Suspended:   { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  };
  const s = map[status] ?? map.Inactive;
  return (
    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.5px', background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    driver:    { bg: 'rgba(8,145,178,0.1)',    color: '#0891b2' },
    conductor: { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6' },
    manager:   { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
  };
  const s = map[role] ?? { bg: 'rgba(100,116,139,0.1)', color: '#64748b' };
  return (
    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {role}
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors: Record<string, string> = { driver: '#0891b2', conductor: '#8b5cf6', manager: '#f59e0b' };
  const c = colors[role] ?? '#64748b';
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${c}22`, border: `1.5px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: 'IBM Plex Mono' }}>{initials}</span>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#10b981' : '#ef4444' }} />
      <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: active ? '#10b981' : '#ef4444' }}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: '#5b7fa0', fontFamily: 'IBM Plex Mono' }}>{label}</span>
        <span style={{ fontSize: 10, color, fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>{value}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#1e3a5f', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 12, borderRadius: 3, background: '#1e3a5f', width: i === 0 ? 100 : 70, animation: 'pulse 1.5s infinite' }} />
        </td>
      ))}
    </tr>
  );
}