'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // This runs CLIENT-SIDE ONLY — localStorage is available here
    if (!AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    // Auth is valid — allow children to render
    setChecked(true);
  }, [router]);

  // Don't render children until we've confirmed auth client-side
  // This prevents a flash of protected content AND the logout loop
  if (!checked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1117',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #1e2535',
          borderTopColor: '#f59e0b',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}