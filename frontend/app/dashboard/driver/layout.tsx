/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';
import type { UserResponse } from '@/types/api';

// Driver nav — minimal, trip-focused
const NAV = [
  { label: 'Dashboard',  href: '/dashboard/driver',          icon: HomeIcon },
  { label: 'My Trips',   href: '/dashboard/driver/trips',    icon: TripIcon },
  { label: 'My Vehicle', href: '/dashboard/driver/vehicle',  icon: BusIcon  },
  { label: 'Profile',    href: '/dashboard/driver/profile',  icon: UserIcon },
];

const G = {
  bg:      '#0a1209',
  surface: '#0d1a0d',
  border:  '#1a3320',
  green:   '#22c55e',
  lime:    '#84cc16',
  text:    '#e8f5e9',
  muted:   '#4d7a52',
  danger:  '#ef4444',
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]   = useState<UserResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [now, setNow]     = useState('');

  useEffect(() => {
    const u = AuthService.getUser();
    if (!u || !AuthService.isAuthenticated()) { router.replace('/login'); return; }
    if (u.role !== 'driver') {
      const map: Record<string, string> = {
        admin: '/dashboard/admin', manager: '/dashboard/manager',
        conductor: '/dashboard/conductor', ntsa: '/dashboard/ntsa',
      };
      router.replace(map[u.role] ?? '/login');
      return;
    }
    setUser(u);
    setChecked(true);
  }, [router]);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { AuthService.clear(); router.replace('/login'); };

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.bg }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${G.border}`, borderTopColor: G.green, animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${G.bg}; color: ${G.text}; font-family: 'Barlow', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }
        .dnav:hover { background: rgba(34,197,94,.08) !important; color: ${G.text} !important; }
        .dbtn:hover { color: ${G.text} !important; }
        .dlogout:hover { color: ${G.danger} !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: G.bg }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 200,
          background: G.surface,
          borderRight: `1px solid ${G.border}`,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ height: 60, padding: '0 16px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.text, letterSpacing: '-.2px' }}>QuickTransit</div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: G.green, textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</div>
            </div>
          </div>

          {/* Live clock */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 4, letterSpacing: '1px' }}>Local Time</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: G.lime, letterSpacing: '2px' }}>{now}</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 0' }}>
            {NAV.map(item => {
              const exact  = item.href === '/dashboard/driver';
              const active = exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dnav"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', margin: '1px 8px', borderRadius: 9,
                    textDecoration: 'none',
                    background: active ? 'rgba(34,197,94,.12)' : 'transparent',
                    color: active ? G.green : G.muted,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: 'all .15s',
                    borderLeft: active ? `2px solid ${G.green}` : '2px solid transparent',
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${G.border}`, padding: '10px 10px' }}>
            {user && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: G.green, textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>
                  {user.employeeId}
                </div>
              </div>
            )}
            <SideBtn icon={<LogoutSvg />} label="Sign out" onClick={handleLogout} className="dlogout" />
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ marginLeft: 200, flex: 1, minHeight: '100vh', background: G.bg, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </>
  );
}

function SideBtn({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={className} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 7,
      background: 'transparent', border: 'none',
      fontSize: 12, cursor: 'pointer',
      color: '#4d7a52', fontFamily: 'Barlow, sans-serif',
      transition: 'color .15s',
    }}>
      {icon}{label}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function TripIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
}
function BusIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/></svg>;
}
function UserIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}