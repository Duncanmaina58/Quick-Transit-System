/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';

const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard',  href: '/dashboard/admin',            icon: GridIcon },
    ],
  },
  {
    group: 'Management',
    items: [
      { label: 'SACCOs',     href: '/dashboard/admin/saccos',     icon: BuildingIcon },
      { label: 'Users',      href: '/dashboard/admin/users',      icon: UsersIcon },
      { label: 'Vehicles',   href: '/dashboard/admin/vehicles',   icon: BusIcon },
      { label: 'Routes',     href: '/dashboard/admin/routes',     icon: RouteIcon },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Trips',      href: '/dashboard/admin/trips',      icon: TripIcon },
      { label: 'Violations', href: '/dashboard/admin/violations', icon: AlertIcon },
      { label: 'Reports',    href: '/dashboard/admin/reports',    icon: ReportIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

 // Replace the useEffect in admin/layout.tsx with this:

const [checked, setChecked] = useState(false);

useEffect(() => {
  const u = AuthService.getUser();

  if (!u || !AuthService.isAuthenticated()) {
    router.replace('/login');
    return;
  }

  if (u.role !== 'admin') {
    const redirectMap: Record<string, string> = {
      manager:   '/dashboard/manager',
      driver:    '/dashboard/driver',
      conductor: '/dashboard/conductor',
      ntsa:      '/dashboard/ntsa',
    };
    router.replace(redirectMap[u.role] ?? '/login');
    return;
  }

  setUser(u);
  setChecked(true);
}, [router]);

// And wrap the return:
if (!checked) return (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1e2535', borderTopColor: '#f59e0b', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

  function handleLogout(): void {
  AuthService.clear();
  router.replace('/login');
}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0f1117; color: #e2e8f0; font-family: 'Sora', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 2px; }
        .nav-link:hover { background: rgba(255,255,255,0.04) !important; color: #e2e8f0 !important; }
        .sidebar-btn:hover { color: #e2e8f0 !important; }
        .logout-btn:hover { color: #ef4444 !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside style={{
          width: collapsed ? 60 : 220,
          background: '#161b26',
          borderRight: '1px solid #1e2535',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
        }}>

          {/* Logo */}
          <div style={{
            padding: '0 14px',
            borderBottom: '1px solid #1e2535',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 60,
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#f59e0b', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap' }}>QuickTransit</div>
                <div style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</div>
              </div>
            )}
          </div>

          {/* Nav groups */}
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV.map(group => (
              <div key={group.group} style={{ marginBottom: 2 }}>
                {!collapsed && (
                  <div style={{
                    padding: '10px 16px 4px',
                    fontSize: 9, fontFamily: 'DM Mono, monospace',
                    textTransform: 'uppercase', letterSpacing: '1.5px', color: '#334155',
                  }}>{group.group}</div>
                )}
                {group.items.map(item => {
                  const isExact  = item.href === '/dashboard/admin';
                  const active   = isExact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-link"
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: collapsed ? '10px 0' : '9px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        margin: '1px 6px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                        color: active ? '#f59e0b' : '#64748b',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                        borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
                      }}
                    >
                      <item.icon size={16} />
                      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer: user chip + actions */}
          <div style={{ borderTop: '1px solid #1e2535', padding: '10px 8px', flexShrink: 0 }}>
            {!collapsed && user && (
              <div style={{
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                marginBottom: 6,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1 }}>
                  System Administrator
                </div>
              </div>
            )}

            <SidebarBtn
              icon={<LogoutSvg />}
              label="Sign out"
              collapsed={collapsed}
              onClick={handleLogout}
              className="logout-btn"
              style={{ color: '#64748b' }}
            />
            <SidebarBtn
              icon={<ChevronSvg flipped={collapsed} />}
              label="Collapse"
              collapsed={collapsed}
              onClick={() => setCollapsed(c => !c)}
              className="sidebar-btn"
              style={{ color: '#64748b', marginTop: 2 }}
            />
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────────── */}
        <main style={{
          marginLeft: collapsed ? 60 : 220,
          flex: 1,
          minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
          background: '#0f1117',
          overflow: 'auto',
        }}>
          {children}
        </main>
      </div>
    </>
  );
}

// ── Role redirect map ─────────────────────────────────────────────────────────
const ROLE_REDIRECT: Record<string, string> = {
  manager:   '/dashboard/manager',
  driver:    '/dashboard/driver',
  conductor: '/dashboard/conductor',
  ntsa:      '/dashboard/ntsa',
};

// ── Small reusable sidebar button ─────────────────────────────────────────────
function SidebarBtn({ icon, label, collapsed, onClick, className, style }: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        width: '100%', display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8, padding: '7px 10px',
        borderRadius: 8, background: 'transparent',
        border: 'none', fontSize: 12,
        cursor: 'pointer', transition: 'color 0.15s',
        fontFamily: 'Sora, sans-serif',
        ...style,
      }}
    >
      {icon}
      {!collapsed && label}
    </button>
  );
}

// ── SVG icons (no external deps) ──────────────────────────────────────────────
function GridIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function BuildingIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function UsersIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function BusIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/></svg>;
}
function RouteIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="19" r="2"/><path d="M6 17V5a2 2 0 012-2h8"/><polyline points="18 5 20 3 22 5"/><path d="M18 3v12a2 2 0 01-2 2H8"/><polyline points="6 21 4 19 6 17"/></svg>;
}
function TripIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
}
function AlertIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function ReportIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function LogoutSvg() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevronSvg({ flipped }: { flipped: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="15 18 9 12 15 6"/></svg>;
}
