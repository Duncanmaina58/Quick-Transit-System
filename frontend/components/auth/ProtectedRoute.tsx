'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if password change is required
    if (AuthService.requiresPasswordChange()) {
      router.push('/first-login');
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = AuthService.getUserRole();
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [router, allowedRoles]);

  // Show loading state while checking authentication
  if (!AuthService.isAuthenticated() || AuthService.requiresPasswordChange()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}