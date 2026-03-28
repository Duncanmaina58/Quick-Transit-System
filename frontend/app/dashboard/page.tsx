'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';

const ROLE_MAP: Record<string, string> = {
  admin:     '/dashboard/admin',
  manager:   '/dashboard/manager',
  driver:    '/dashboard/driver',
  conductor: '/dashboard/conductor',
  ntsa:      '/dashboard/ntsa',
};

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const role = AuthService.getUserRole() ?? '';
    router.replace(ROLE_MAP[role] ?? '/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1117',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #1e2535',
          borderTopColor: '#f59e0b',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#64748b', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
          Redirecting...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}