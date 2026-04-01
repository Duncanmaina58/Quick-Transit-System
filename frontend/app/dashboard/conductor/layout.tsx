/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';

const NAV = [
  { label: 'Dashboard', href: '/dashboard/conductor',        exact: true,  icon: HomeIcon   },
  { label: 'My Trips',  href: '/dashboard/conductor/trips',  exact: false, icon: TripIcon   },
  { label: 'Profile',   href: '/dashboard/conductor/profile',exact: false, icon: UserIcon   },
];

const V = {
  bg:      '#0f0f1a',
  surface: '#13132a',
  border:  '#1e1e4a',
  violet:  '#8b5cf6',
  text:    '#ede9fe',
  muted:   '#5b5b99',
  danger:  '#ef4444',
};

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [checked, setChecked]   = useState(false);
  const [userName, setUserName] = useState('');
  const [empId, setEmpId]       = useState('');

  useEffect(() => {
    const u = AuthService.getUser();
    if (!u || !AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (u.role !== 'conductor') {
      const redirects: Record<string, string> = {
        admin:   '/dashboard/admin',
        manager: '/dashboard/manager',
        driver:  '/dashboard/driver',
        ntsa:    '/dashboard/ntsa',
      };
      router.replace(redirects[u.role] ?? '/login');
      return;
    }
    setUserName(`${u.firstName} ${u.lastName}`);
    setEmpId(u.employeeId ?? '');
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    AuthService.clear();
    router.replace('/login');
  };

  if (!checked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: V.bg }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${V.border}`, borderTopColor: V.violet, animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${V.bg}; color: ${V.text}; font-family: 'Nunito', sans-serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 2px; }
        .clink:hover  { background: rgba(139,92,246,.1) !important; color: ${V.text} !important; }
        .clink:hover svg { color: ${V.violet} !important; }
        .clogout:hover { background: rgba(239,68,68,.08) !important; color: ${V.danger} !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <aside style={{
          width: 200, flexShrink: 0,
          background: V.surface,
          borderRight: `1px solid ${V.border}`,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        }}>
          {/* Brand */}
          <div style={{ height: 58, padding: '0 16px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TicketIcon size={15} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: V.text, letterSpacing: '-.2px' }}>QuickTransit</div>
              <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', color: V.violet, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Conductor</div>
            </div>
          </div>

          {/* User info */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${V.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,.15)', border: `1px solid rgba(139,92,246,.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: V.violet }}>
                  {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: V.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', color: V.violet, textTransform: 'uppercase', letterSpacing: '.8px' }}>{empId}</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {NAV.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className="clink" style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 14px', margin: '1px 8px', borderRadius: 8,
                  textDecoration: 'none',
                  background: active ? 'rgba(139,92,246,.1)' : 'transparent',
                  color: active ? V.violet : V.muted,
                  fontSize: 12.5, fontWeight: active ? 700 : 400,
                  borderLeft: `2px solid ${active ? V.violet : 'transparent'}`,
                  transition: 'all .12s',
                }}>
                  <item.icon size={15} color={active ? V.violet : V.muted} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Status indicator — shows if on active trip */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
            <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 4, letterSpacing: '1px' }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: V.muted }} id="status-dot" />
              <span style={{ fontSize: 10, color: V.muted, fontFamily: 'Space Mono, monospace' }} id="status-label">Off shift</span>
            </div>
          </div>

          {/* Logout */}
          <div style={{ padding: '8px' }}>
            <button onClick={handleLogout} className="clogout" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 7,
              background: 'transparent', border: 'none',
              color: V.muted, fontSize: 12, cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', transition: 'all .12s',
            }}>
              <LogoutIcon size={14} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main style={{ marginLeft: 200, flex: 1, minHeight: '100vh', background: V.bg, overflow: 'auto' }}>
          {children}
        </main>

        {/* ── Bottom nav (mobile) ────────────────────────────────────── */}
        <nav style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: V.surface, borderTop: `1px solid ${V.border}`, padding: '6px 0 env(safe-area-inset-bottom)' }} id="mobile-nav">
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px', textDecoration: 'none', flex: 1,
                color: active ? V.violet : V.muted, fontSize: 9,
                fontFamily: 'Nunito, sans-serif', fontWeight: active ? 700 : 400,
              }}>
                <item.icon size={18} color={active ? V.violet : V.muted} />
                {item.label}
              </Link>
            );
          })}
        </nav>

      </div>

      <style>{`
        @media (max-width: 640px) {
          aside { display: none !important; }
          main  { margin-left: 0 !important; padding-bottom: 68px; }
          #mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function TripIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;
}
function UserIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function TicketIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6v6a3 3 0 010 6H2a3 3 0 010-6V9z"/><line x1="8" y1="12" x2="16" y2="12" strokeDasharray="2 2"/></svg>;
}
function LogoutIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}