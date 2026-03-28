/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { AuthService } from '@/lib/utils/auth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Password strength logic — mirrors backend ValidatePasswordStrength
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%&*]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Too weak',  color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Weak',      color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Fair',      color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Strong',    color: 'bg-blue-500' };
  return              { score, label: 'Very strong', color: 'bg-green-500' };
}

const ROLE_REDIRECTS: Record<string, string> = {
  admin:     '/dashboard/admin',
  manager:   '/dashboard/manager',
  driver:    '/dashboard/driver',
  conductor: '/dashboard/conductor',
  ntsa:      '/dashboard/ntsa',
};

export default function FirstLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    temporaryPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    temp: false, new: false, confirm: false,
  });

  // Pre-fill email from localStorage (set during login redirect)
  useEffect(() => {
    const saved = localStorage.getItem('tempEmail');
    if (saved) {
      setFormData(prev => ({ ...prev, email: saved }));
    }
  }, []); // ← empty deps: runs once on mount, no lint warning

  const strength = getPasswordStrength(formData.newPassword);

  const firstLoginMutation = useMutation({
    mutationFn: (data: { email: string; temporaryPassword: string; newPassword: string; confirmNewPassword: string }) =>
      authApi.firstLogin(data),
    onSuccess: (response) => {
      // Backend returns standard AuthResponse: { token, expiresAt, forcePasswordChange, user }
      const authData = response.data;

      AuthService.setToken(authData.token);
      localStorage.setItem('accessToken', authData.token);
      localStorage.setItem('userData', JSON.stringify(authData.user));
      localStorage.removeItem('tempEmail');
      localStorage.removeItem('tempToken');

      toast.success('Password updated! Welcome to QuickTransit.');

      const role = authData.user?.role ?? AuthService.getUserRole();
      router.push(ROLE_REDIRECTS[role] ?? '/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Failed to change password. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    // Frontend mirrors backend password rules
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.'); return;
    }
    if (!/[A-Z]/.test(formData.newPassword)) {
      toast.error('Password must contain an uppercase letter.'); return;
    }
    if (!/[a-z]/.test(formData.newPassword)) {
      toast.error('Password must contain a lowercase letter.'); return;
    }
    if (!/[0-9]/.test(formData.newPassword)) {
      toast.error('Password must contain a number.'); return;
    }
    if (!/[!@#$%&*]/.test(formData.newPassword)) {
      toast.error('Password must contain a special character (!@#$%&*).'); return;
    }

    firstLoginMutation.mutate({
      email: formData.email,
      temporaryPassword: formData.temporaryPassword,
      newPassword: formData.newPassword,
      confirmNewPassword: formData.confirmPassword,
    });
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const toggleShow = (field: keyof typeof showPasswords) =>
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-10">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-4 shadow-lg shadow-amber-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Set New Password</h1>
            <p className="text-amber-300/70 text-sm mt-1">Your temporary password must be changed before continuing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-100/80 mb-1.5">Email address</label>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                placeholder="you@quicktransit.app"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30
                           focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
              />
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block text-sm font-medium text-blue-100/80 mb-1.5">Temporary password</label>
              <div className="relative">
                <input
                  type={showPasswords.temp ? 'text' : 'password'}
                  name="temporaryPassword" required
                  value={formData.temporaryPassword} onChange={handleChange}
                  placeholder="From your welcome email"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30
                             focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
                />
                <button type="button" onClick={() => toggleShow('temp')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  <EyeIcon show={showPasswords.temp} />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-blue-100/80 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword" required
                  value={formData.newPassword} onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30
                             focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
                />
                <button type="button" onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  <EyeIcon show={showPasswords.new} />
                </button>
              </div>

              {/* Strength meter */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium transition-colors ${
                    strength.score <= 2 ? 'text-red-400' : strength.score === 3 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-blue-100/80 mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword" required
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Repeat your new password"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border text-white placeholder-white/30
                             focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm
                             ${formData.confirmPassword && formData.confirmPassword !== formData.newPassword
                               ? 'border-red-500/60' : 'border-white/20'}`}
                />
                <button type="button" onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  <EyeIcon show={showPasswords.confirm} />
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.newPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Requirements checklist */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Requirements</p>
              {[
                { label: 'At least 8 characters',        met: formData.newPassword.length >= 8 },
                { label: 'One uppercase letter (A-Z)',   met: /[A-Z]/.test(formData.newPassword) },
                { label: 'One lowercase letter (a-z)',   met: /[a-z]/.test(formData.newPassword) },
                { label: 'One number (0-9)',              met: /[0-9]/.test(formData.newPassword) },
                { label: 'One special character (!@#$%&*)', met: /[!@#$%&*]/.test(formData.newPassword) },
              ].map(req => (
                <div key={req.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    req.met ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {req.met && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs transition-colors ${req.met ? 'text-green-400' : 'text-white/40'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={firstLoginMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {firstLoginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating password...
                </>
              ) : (
                'Set Password & Continue →'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}