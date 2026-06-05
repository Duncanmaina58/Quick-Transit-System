/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, ArrowRight, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin'; // adjust to your actual import path
import type { UserRole } from '@/types/api';
interface CreatedCredentials {
  employeeId: string;
  email: string;
  temporaryPassword: string | null; // null when email was sent
  fullName: string;
  role: string;
  emailSent: boolean;
}

export function AddCrewForm() {
  const [step, setStep] = useState<'form' | 'credentials'>('form');
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  saccoId: string;
  sendCredentials: boolean;
}>({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  role: 'driver' as UserRole,
  saccoId: '',
  sendCredentials: true,
});

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'driver',
      saccoId: '',
      sendCredentials: true,
    });
    setCredentials(null);
    setStep('form');
  };

  const createUserMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      adminApi.createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        saccoId: data.saccoId ? data.saccoId : undefined,
        sendCredentials: data.sendCredentials,
      }),
    onSuccess: (response) => {
      // Backend CreateUserResponse: { success, message, user, temporaryPassword }
      const { user, temporaryPassword, message } = response.data;

      setCredentials({
        employeeId: user.employeeId,
        email: user.email,
        temporaryPassword: temporaryPassword ?? null,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        emailSent: formData.sendCredentials,
      });

      setStep('credentials');
      toast.success(message || 'Crew member created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Failed to create crew member.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ── Credentials step ──────────────────────────────────────────────────────
  if (step === 'credentials' && credentials) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success banner */}
        <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
              Crew Member Added Successfully
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>{credentials.fullName}</strong> ({credentials.role}) has been registered.
              {credentials.emailSent && ' Credentials were sent to their email.'}
            </p>
          </div>
        </div>

        {/* Credentials card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {credentials.emailSent ? 'Account Details' : 'Temporary Credentials'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {credentials.emailSent
                ? 'Credentials have been emailed. The details below are for your records.'
                : 'Email was not sent. Share these credentials securely with the crew member.'}
            </p>
          </div>

          {/* Employee ID */}
          <CredentialRow
            label="Employee ID"
            value={credentials.employeeId}
            field="employeeId"
            copiedField={copiedField}
            onCopy={copyToClipboard}
            large
          />

          {/* Email */}
          <CredentialRow
            label="Email"
            value={credentials.email}
            field="email"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />

          {/* Temp password — only shown if NOT emailed */}
          {credentials.temporaryPassword ? (
            <CredentialRow
              label="Temporary Password"
              value={credentials.temporaryPassword}
              field="password"
              copiedField={copiedField}
              onCopy={copyToClipboard}
              sensitive
            />
          ) : (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Temporary Password</p>
              <p className="text-sm text-muted-foreground italic">Sent securely to {credentials.email}</p>
            </div>
          )}

          {/* Notice */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Important</p>
              <p className="text-muted-foreground">
                The user will be required to change their password on first login.
                {credentials.emailSent
                  ? ' Credentials are valid for 24 hours.'
                  : ' Share these credentials securely — do not send via unencrypted channels.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={resetForm}>
            Add Another Member
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.location.href = '/dashboard/admin/crew'}
          >
            Go to Crew List
          </Button>
        </div>
      </div>
    );
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Crew Member</h1>
        <p className="text-muted-foreground mt-2">
          Register a new driver, conductor, or supervisor account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal Information */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
              <Input name="firstName" placeholder="John" value={formData.firstName}
                onChange={handleChange} className="bg-secondary border-border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
              <Input name="lastName" placeholder="Kamau" value={formData.lastName}
                onChange={handleChange} className="bg-secondary border-border" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input type="email" name="email" placeholder="john.kamau@example.com"
              value={formData.email} onChange={handleChange}
              className="bg-secondary border-border" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
            <Input type="tel" name="phoneNumber" placeholder="+254 712 345 678"
              value={formData.phoneNumber} onChange={handleChange}
              className="bg-secondary border-border" required />
          </div>
        </div>

        {/* Job Information */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Job Information</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:ring-2 focus:ring-primary">
              <option value="driver">Driver</option>
              <option value="conductor">Conductor</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              SACCO ID <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input name="saccoId" placeholder="e.g. sacco-uuid" value={formData.saccoId}
              onChange={handleChange} className="bg-secondary border-border" />
          </div>
        </div>

        {/* Credential delivery */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Credential Delivery</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="sendCredentials"
              checked={formData.sendCredentials}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Send credentials via email</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Uncheck to view credentials here instead — useful if the user has no email access yet.
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={createUserMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 gap-2 font-medium"
        >
          {createUserMutation.isPending ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Crew Member
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

// ── Reusable credential row ───────────────────────────────────────────────────
function CredentialRow({
  label, value, field, copiedField, onCopy, large, sensitive,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
  large?: boolean;
  sensitive?: boolean;
}) {
  const copied = copiedField === field;
  return (
    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono ${large ? 'text-2xl font-bold' : 'text-base'} text-foreground break-all`}>
          {sensitive ? (
            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
              {value}
            </span>
          ) : value}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-1.5"
          onClick={() => onCopy(value, field)}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}