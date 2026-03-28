/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';
import type { UserResponse } from '@/types/api';

const NAV = [
  { label: 'Dashboard', href: '/dashboard/conductor',         icon: HomeIcon },
  { label: 'My Trips',  href: '/dashboard/conductor/trips',  icon: TripIcon },
  { label: 'Profile',   href: '/dashboard/conductor/profile',icon: UserIcon },
];

const V = {
  bg:      '#0f0f1a',
  surface: '#13132a',
  border:  '#1e1e4a',
  violet:  '#8b5cf6',
  purple:  '#7c3aed',
  text:    '#ede9fe',
  muted:   '#5b5b99',
  danger:  '#ef4444',
  success: '#10b981',
};

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]   = useState<UserResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [now, setNow]     = useState('');

  useEffect(() => {
    const u = AuthService.getUser();
    if (!u || !AuthService.isAuthenticated()) { router.replace('/login'); return; }
    if (u.role !== 'conductor') {
      const map: Record<string, string> = {
        admin: '/dashboard/admin', manager: '/dashboard/manager',
        driver: '/dashboard/driver', ntsa: '/dashboard/ntsa',
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: V.bg }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${V.border}`, borderTopColor: V.violet, animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${V.bg}; color: ${V.text}; font-family: 'Nunito', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 2px; }
        .cnav:hover { background: rgba(139,92,246,.08) !important; color: ${V.text} !important; }
        .cbtn:hover { color: ${V.text} !important; }
        .clogout:hover { color: ${V.danger} !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: V.bg }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 200,
          background: V.surface,
          borderRight: `1px solid ${V.border}`,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ height: 60, padding: '0 16px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {/* Ticket icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6v6a3 3 0 010 6H2a3 3 0 010-6V9z"/>
                <line x1="8" y1="12" x2="16" y2="12" strokeDasharray="2 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: V.text, letterSpacing: '-.2px' }}>QuickTransit</div>
              <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: V.violet, textTransform: 'uppercase', letterSpacing: '1px' }}>Conductor</div>
            </div>
          </div>

          {/* Live clock */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${V.border}` }}>
            <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 4, letterSpacing: '1px' }}>Shift Time</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, fontWeight: 700, color: V.violet, letterSpacing: '2px' }}>{now}</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 0' }}>
            {NAV.map(item => {
              const exact  = item.href === '/dashboard/conductor';
              const active = exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className="cnav" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', margin: '1px 8px', borderRadius: 9,
                  textDecoration: 'none',
                  background: active ? 'rgba(139,92,246,.12)' : 'transparent',
                  color: active ? V.violet : V.muted,
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  transition: 'all .15s',
                  borderLeft: active ? `2px solid ${V.violet}` : '2px solid transparent',
                }}>
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${V.border}`, padding: '10px' }}>
            {user && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: V.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: V.violet, textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>
                  {user.employeeId}
                </div>
              </div>
            )}
            <SideBtn icon={<LogoutSvg />} label="Sign out" onClick={handleLogout} className="clogout" />
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ marginLeft: 200, flex: 1, minHeight: '100vh', background: V.bg, overflow: 'auto' }}>
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
      fontSize: 12, cursor: 'pointer', color: '#5b5b99',
      fontFamily: 'Nunito, sans-serif', transition: 'color .15s',
    }}>
      {icon}{label}
    </button>
  );
}

function HomeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function TripIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
}
function UserIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}