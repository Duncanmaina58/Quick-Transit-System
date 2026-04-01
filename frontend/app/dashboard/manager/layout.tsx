/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';
import type { UserResponse } from '@/types/api';

const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard',  href: '/dashboard/manager',           icon: DashIcon },
    ],
  },
  {
    group: 'Fleet',
    items: [
      { label: 'Vehicles',   href: '/dashboard/manager/vehicles',  icon: BusIcon },
      { label: 'Routes',     href: '/dashboard/manager/routes',    icon: RouteIcon },
    ],
  },
  {
    group: 'Crew',
    items: [
      { label: 'Crew Members', href: '/dashboard/manager/crew',   icon: CrewIcon },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Trips',      href: '/dashboard/manager/trips',    icon: TripIcon },

{ label: 'tracking',      href: '/dashboard/manager/tracking',    icon: TripIcon },

      { label: 'Violations', href: '/dashboard/manager/violations',icon: AlertIcon },
      { label: 'Reports',    href: '/dashboard/manager/reports',  icon: ReportIcon },
    ],
  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser]           = useState<UserResponse | null>(null);
  const [checked, setChecked]     = useState(false);

  useEffect(() => {
    const u = AuthService.getUser();
    if (!u || !AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (u.role !== 'manager') {
      const map: Record<string, string> = {
        admin: '/dashboard/admin', driver: '/dashboard/driver',
        conductor: '/dashboard/conductor', ntsa: '/dashboard/ntsa',
      };
      router.replace(map[u.role] ?? '/login');
      return;
    }
    setUser(u);
    setChecked(true);
  }, [router]);

  const handleLogout = () => { AuthService.clear(); router.replace('/login'); };

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1b2a' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1e3a5f', borderTopColor: '#0891b2', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0d1b2a; color: #e2eaf3; font-family: 'IBM Plex Sans', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .mnav-link:hover { background: rgba(8,145,178,0.08) !important; color: #e2eaf3 !important; }
        .mbtn:hover { color: #e2eaf3 !important; }
        .mlogout:hover { color: #f87171 !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1b2a' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside style={{
          width: collapsed ? 58 : 224,
          background: '#0a1628',
          borderRight: '1px solid #1e3a5f',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden', flexShrink: 0,
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        }}>

          {/* Logo strip */}
          <div style={{
            height: 58, padding: '0 14px', flexShrink: 0,
            borderBottom: '1px solid #1e3a5f',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2eaf3', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                  QuickTransit
                </div>
                <div style={{ fontSize: 9, color: '#0891b2', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 1 }}>
                  Manager Portal
                </div>
              </div>
            )}
          </div>

          {/* SACCO badge */}
          {!collapsed && user?.saccoName && (
            <div style={{
              margin: '10px 8px 2px',
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(8,145,178,0.08)',
              border: '1px solid rgba(8,145,178,0.2)',
            }}>
              <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: '#0891b2', marginBottom: 2 }}>SACCO</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#e2eaf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.saccoName}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV.map(group => (
              <div key={group.group} style={{ marginBottom: 2 }}>
                {!collapsed && (
                  <div style={{ padding: '8px 14px 3px', fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2d5a7a' }}>
                    {group.group}
                  </div>
                )}
                {group.items.map(item => {
                  const exact  = item.href === '/dashboard/manager';
                  const active = exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="mnav-link"
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: 9,
                        padding: collapsed ? '10px 0' : '8px 13px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        margin: '1px 6px', borderRadius: 7,
                        textDecoration: 'none',
                        background: active ? 'rgba(8,145,178,0.12)' : 'transparent',
                        color: active ? '#0891b2' : '#5b7fa0',
                        fontSize: 12.5, fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                        borderLeft: active ? '2px solid #0891b2' : '2px solid transparent',
                      }}
                    >
                      <item.icon size={15} />
                      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #1e3a5f', padding: '10px 8px', flexShrink: 0 }}>
            {!collapsed && user && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1 }}>
                  SACCO Manager
                </div>
              </div>
            )}
            <MBtn icon={<LogoutSvg />} label="Sign out" collapsed={collapsed} onClick={handleLogout} className="mlogout" />
            <MBtn icon={<ChevronSvg flipped={collapsed} />} label="Collapse" collapsed={collapsed} onClick={() => setCollapsed(c => !c)} className="mbtn" />
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────────── */}
        <main style={{
          marginLeft: collapsed ? 58 : 224,
          flex: 1, minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
          background: '#0d1b2a', overflow: 'auto',
        }}>
          {children}
        </main>
      </div>
    </>
  );
}

// ── Sidebar button ────────────────────────────────────────────────────────────
function MBtn({ icon, label, collapsed, onClick, className }: {
  icon: React.ReactNode; label: string; collapsed: boolean;
  onClick: () => void; className?: string;
}) {
  return (
    <button onClick={onClick} className={className} style={{
      width: '100%', display: 'flex', alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 8, padding: '7px 10px', borderRadius: 7,
      background: 'transparent', border: 'none',
      fontSize: 12, cursor: 'pointer', transition: 'color 0.15s',
      color: '#5b7fa0', fontFamily: 'IBM Plex Sans, sans-serif',
    }}>
      {icon}
      {!collapsed && label}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function DashIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function BusIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/></svg>;
}
function RouteIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="19" r="2"/><path d="M6 17V5a2 2 0 012-2h8"/><polyline points="18 5 20 3 22 5"/><path d="M18 3v12a2 2 0 01-2 2H8"/><polyline points="6 21 4 19 6 17"/></svg>;
}
function CrewIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function TripIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
}
function AlertIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function ReportIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function LogoutSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevronSvg({ flipped }: { flipped: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="15 18 9 12 15 6"/></svg>;
}