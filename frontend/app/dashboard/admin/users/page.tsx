/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import type {
  UserResponse, UserFilterRequest, CreateUserRequest, UpdateUserRequest,
  SaccoSummaryResponse,
} from '@/types/api';

const T = {
  surface: '#161b26', border: '#1e2535', amber: '#f59e0b',
  text: '#e2e8f0', muted: '#64748b', danger: '#ef4444', success: '#10b981',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0f1117', border: '1px solid #1e2535',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13,
  fontFamily: 'Sora, sans-serif', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11,
  fontFamily: 'DM Mono, monospace', textTransform: 'uppercase',
  letterSpacing: '0.8px', color: '#64748b', marginBottom: 6,
};

const ROLES = ['driver', 'conductor', 'manager', 'ntsa', 'admin'] as const;

const ROLE_META: Record<string, { bg: string; color: string; label: string }> = {
  admin:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Admin' },
  manager:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Manager' },
  driver:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Driver' },
  conductor: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6', label: 'Conductor' },
  ntsa:      { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'NTSA' },
};

export default function UsersPage() {
  const qc = useQueryClient();

  const [filter, setFilter] = useState<UserFilterRequest>({ page: 1, pageSize: 15 });
  const [modal, setModal] = useState<
    null
    | { type: 'create' }
    | { type: 'edit';         user: UserResponse }
    | { type: 'view';         user: UserResponse }
    | { type: 'reset';        user: UserResponse }
  >(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['users', filter],
    queryFn: () => adminApi.getAllUsers(filter),
  });

  const { data: saccosData } = useQuery({
    queryKey: ['saccos-summaries'],
    queryFn: () => adminApi.getSaccoSummaries(),
  });

  const users   = data?.data?.data ?? [];
  const meta    = data?.data;
  const saccos  = saccosData?.data?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (req: CreateUserRequest) => adminApi.createUser(req),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setModal(null);
      const pwd = res.data?.temporaryPassword;
      toast.success(pwd ? `Created! Temp password: ${pwd}` : 'Created! Credentials emailed.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create user.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateUserRequest }) => adminApi.updateUser(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); toast.success('User updated.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update user.'),
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.activateUser(id, isActive),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(`User ${v.isActive ? 'activated' : 'deactivated'}.`); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const resetPwdMutation = useMutation({
    mutationFn: (email: string) => adminApi.resetPassword({ email, sendNewPassword: true }),
    onSuccess: () => { setModal(null); toast.success('Password reset. New credentials emailed.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to reset password.'),
  });

  const handleFilterChange = useCallback((k: keyof UserFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        input:focus, select:focus { border-color: #f59e0b !important; }
        .user-row:hover td { background: rgba(245,158,11,0.03); }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: '-0.4px' }}>User Management</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
            {meta?.totalCount ?? 0} registered accounts across all roles
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 8,
          background: T.amber, border: 'none',
          color: '#000', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New User
        </button>
      </div>

      {/* Role summary chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <RoleChip label="All" count={meta?.totalCount} active={!filter.role} onClick={() => handleFilterChange('role', '')} />
        {ROLES.map(r => (
          <RoleChip key={r} label={r} active={filter.role === r} onClick={() => handleFilterChange('role', filter.role === r ? '' : r)} />
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        padding: '14px 16px', background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 20,
      }}>
        <input
          placeholder="Search name, email or employee ID..."
          value={filter.search ?? ''}
          onChange={e => handleFilterChange('search', e.target.value)}
          style={{ ...inputStyle, width: 280 }}
        />
        <select
          value={filter.saccoId ?? ''}
          onChange={e => handleFilterChange('saccoId', e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        >
          <option value="">All SACCOs</option>
          {saccos.map((s: SaccoSummaryResponse) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filter.isActive === undefined ? '' : String(filter.isActive)}
          onChange={e => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
          style={{ ...inputStyle, width: 130 }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          onClick={() => setFilter({ page: 1, pageSize: 15 })}
          style={{ padding: '9px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Employee', 'Contact', 'Role', 'SACCO', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 18px' }}>
                      <div style={{ height: 14, borderRadius: 4, background: '#1e2535', width: [140, 120, 70, 100, 60, 80, 60][j], animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
                  No users match the current filters.
                </td>
              </tr>
            ) : users.map((u: UserResponse) => (
              <tr key={u.id} className="user-row" style={{ borderBottom: `1px solid rgba(30,37,53,0.6)`, transition: 'background 0.1s' }}>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={u.fullName} role={u.role} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{u.fullName}</div>
                      <div style={{ fontSize: 10, color: T.amber, fontFamily: 'DM Mono, monospace', marginTop: 1 }}>{u.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ fontSize: 12, color: T.text, fontFamily: 'DM Mono, monospace' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{u.phoneNumber}</div>
                </td>
                <td style={{ padding: '12px 18px' }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: '12px 18px', fontSize: 12, color: T.muted }}>
                  {u.saccoName ?? <span style={{ color: '#334155', fontFamily: 'DM Mono, monospace' }}>—</span>}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <StatusBadge active={u.isActive} />
                    {u.forcePasswordChange && (
                      <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠ Pwd change</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 18px', fontSize: 11, color: T.muted, fontFamily: 'DM Mono, monospace' }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-KE', { dateStyle: 'short' }) : 'Never'}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ActionBtn icon="👁"  label="View"   onClick={() => setModal({ type: 'view', user: u })} />
                    <ActionBtn icon="✏️"  label="Edit"   onClick={() => setModal({ type: 'edit', user: u })} />
                    <ActionBtn icon="🔑"  label="Reset Password" onClick={() => setModal({ type: 'reset', user: u })} />
                    <ActionBtn
                      icon={u.isActive ? '⏸' : '▶'}
                      label={u.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() => activateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: T.muted }}>
              Page {meta.page} of {meta.totalPages} · {meta.totalCount} users
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <PagBtn label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
              <PagBtn label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'create' && (
        <UserFormModal
          title="Create User"
          saccos={saccos}
          onClose={() => setModal(null)}
          onSubmit={(req) =>
  createMutation.mutate(req as CreateUserRequest)
}
          loading={createMutation.isPending}
        />
      )}
      {modal?.type === 'edit' && (
        <UserFormModal
          title="Edit User"
          initial={modal.user}
          saccos={saccos}
          onClose={() => setModal(null)}
          onSubmit={(req) => updateMutation.mutate({ id: modal.user.id, req: req as UpdateUserRequest })}
          loading={updateMutation.isPending}
        />
      )}
      {modal?.type === 'view' && (
        <ViewUserModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onConfirm={() => resetPwdMutation.mutate(modal.user.email)}
          loading={resetPwdMutation.isPending}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ── User Form Modal ───────────────────────────────────────────────────────────
function UserFormModal({ title, initial, saccos, onClose, onSubmit, loading }: {
  title: string;
  initial?: UserResponse;
  saccos: SaccoSummaryResponse[];
  onClose: () => void;
  onSubmit: (req: CreateUserRequest | UpdateUserRequest) => void;
  loading: boolean;
}) {
  const isEdit = !!initial;
  const [f, setF] = useState({
    firstName:       initial?.firstName ?? '',
    lastName:        initial?.lastName  ?? '',
    email:           initial?.email     ?? '',
    phoneNumber:     initial?.phoneNumber ?? '',
    role:            initial?.role      ?? 'driver',
    saccoId:         initial?.saccoId   ?? '',
    isActive:        initial?.isActive  ?? true,
    sendCredentials: true,
  });

  const handleChange = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  // Show SACCO field only for crew roles
  const needsSacco = ['driver', 'conductor', 'manager'].includes(f.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({ firstName: f.firstName, lastName: f.lastName, phoneNumber: f.phoneNumber, role: f.role, saccoId: f.saccoId || undefined, isActive: f.isActive } as UpdateUserRequest);
    } else {
      onSubmit({ firstName: f.firstName, lastName: f.lastName, email: f.email, phoneNumber: f.phoneNumber, role: f.role as any, saccoId: f.saccoId || undefined, sendCredentials: f.sendCredentials } as CreateUserRequest);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 520 }}>
        <ModalHeader title={title} onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={f.firstName} onChange={e => handleChange('firstName', e.target.value)} required placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={f.lastName} onChange={e => handleChange('lastName', e.target.value)} required placeholder="Kamau" />
            </div>

            {!isEdit && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" style={inputStyle} value={f.email} onChange={e => handleChange('email', e.target.value)} required placeholder="john.kamau@example.com" />
              </div>
            )}

            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} value={f.phoneNumber} onChange={e => handleChange('phoneNumber', e.target.value)} required placeholder="+254 712 345 678" />
            </div>

            <div>
              <label style={labelStyle}>Role *</label>
              <select style={inputStyle} value={f.role} onChange={e => handleChange('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>

            {needsSacco && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>SACCO {f.role === 'driver' || f.role === 'conductor' ? '*' : '(optional)'}</label>
                <select style={inputStyle} value={f.saccoId} onChange={e => handleChange('saccoId', e.target.value)}>
                  <option value="">Select SACCO...</option>
                  {saccos.map((s: SaccoSummaryResponse) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>
                  ))}
                </select>
              </div>
            )}

            {isEdit && (
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={String(f.isActive)} onChange={e => handleChange('isActive', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}

            {!isEdit && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ ...labelStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={f.sendCredentials}
                    onChange={e => handleChange('sendCredentials', e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: T.amber }}
                  />
                  Send login credentials via email
                </label>
                {!f.sendCredentials && (
                  <p style={{ fontSize: 11, color: T.amber, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
                    ⚠ Temporary password will be shown once after creation.
                  </p>
                )}
              </div>
            )}
          </div>
          <ModalFooter onClose={onClose} loading={loading} submitLabel={isEdit ? 'Save Changes' : 'Create User'} />
        </form>
      </div>
    </Overlay>
  );
}

// ── View User Modal ───────────────────────────────────────────────────────────
function ViewUserModal({ user, onClose }: { user: UserResponse; onClose: () => void }) {
  const fields = [
    { label: 'Employee ID',  value: user.employeeId },
    { label: 'Role',         value: user.role },
    { label: 'Email',        value: user.email },
    { label: 'Phone',        value: user.phoneNumber || '—' },
    { label: 'SACCO',        value: user.saccoName || '—' },
    { label: 'Last Login',   value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-KE') : 'Never' },
    { label: 'Created',      value: new Date(user.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) },
    { label: 'Pwd Change',   value: user.forcePasswordChange ? 'Required' : 'Up to date' },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 480 }}>
        <ModalHeader title="User Profile" onClose={onClose} />
        <div style={{ padding: '20px 24px' }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: '#0f1117', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <Avatar name={user.fullName} role={user.role} size={48} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{user.fullName}</div>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <RoleBadge role={user.role} />
                <StatusBadge active={user.isActive} />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <div key={f.label} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.8px', color: T.muted, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: T.text, fontFamily: ['Email', 'Employee ID'].includes(f.label) ? 'DM Mono, monospace' : 'Sora, sans-serif' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', borderTop: `1px solid ${T.border}`, textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Reset Password Confirm Modal ──────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onConfirm, loading }: {
  user: UserResponse; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420 }}>
        <ModalHeader title="Reset Password" onClose={onClose} />
        <div style={{ padding: '24px' }}>
          <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#f87171', lineHeight: 1.6 }}>
              This will generate a new temporary password and send it to <strong>{user.email}</strong>.
              The user will be required to change it on next login.
            </p>
          </div>
          <div style={{ padding: '12px', background: '#0f1117', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: T.muted, marginBottom: 4 }}>TARGET USER</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{user.fullName}</div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: T.amber }}>{user.employeeId}</div>
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, background: T.danger, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Sending...' : 'Reset & Email'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.18s ease' }}>
        {children}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.3px' }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
    </div>
  );
}

function ModalFooter({ onClose, loading, submitLabel }: { onClose: () => void; loading: boolean; submitLabel: string }) {
  return (
    <div style={{ padding: '12px 24px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
      <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, background: T.amber, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

function Avatar({ name, role, size = 34 }: { name: string; role: string; size?: number }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors: Record<string, string> = { admin: '#f59e0b', manager: '#3b82f6', driver: '#10b981', conductor: '#8b5cf6', ntsa: '#ef4444' };
  const bg = colors[role] ?? '#64748b';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${bg}22`, border: `2px solid ${bg}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: bg, fontFamily: 'DM Mono, monospace' }}>{initials}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: role };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: active ? T.success : T.danger, border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleChip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  const m = ROLE_META[label];
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
      fontSize: 11, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px',
      background: active ? (m?.bg ?? 'rgba(245,158,11,0.12)') : 'rgba(255,255,255,0.03)',
      color: active ? (m?.color ?? T.amber) : T.muted,
      border: `1px solid ${active ? (m?.color ?? T.amber) + '44' : T.border}`,
      transition: 'all 0.15s',
    }}>
      {label} {count !== undefined ? `(${count})` : ''}
    </button>
  );
}

function ActionBtn({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={label} onClick={onClick}
      style={{ padding: '5px 7px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, opacity: 0.6, transition: 'opacity 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; if (danger) e.currentTarget.style.borderColor = T.danger; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = T.border; }}
    >{icon}</button>
  );
}

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '6px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
      {label}
    </button>
  );
}