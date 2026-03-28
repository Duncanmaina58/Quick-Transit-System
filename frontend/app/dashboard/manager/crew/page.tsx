/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { AuthService } from '@/lib/utils/auth';
import type { UserResponse, UserFilterRequest, CreateUserRequest } from '@/types/api';

const T = {
  bg: '#0d1b2a', surface: '#0a1628', card: '#0f2033',
  border: '#1e3a5f', teal: '#0891b2',
  text: '#e2eaf3', muted: '#5b7fa0',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  background: '#0a1628', border: '1px solid #1e3a5f',
  borderRadius: 7, color: '#e2eaf3',
  fontSize: 12.5, fontFamily: 'IBM Plex Sans, sans-serif', outline: 'none',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontFamily: 'IBM Plex Mono',
  textTransform: 'uppercase', letterSpacing: '0.8px', color: '#5b7fa0', marginBottom: 5,
};

const CREW_ROLES = ['driver', 'conductor'] as const;

export default function CrewPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const saccoId  = AuthService.getSaccoId();
  const saccoName = AuthService.getUser()?.saccoName;

  const [filter, setFilter] = useState<UserFilterRequest>({
    saccoId: saccoId ?? undefined,
    page: 1, pageSize: 15,
  });
  const [modal, setModal] = useState<
    null
    | { type: 'create' }
    | { type: 'edit';  user: UserResponse }
    | { type: 'view';  user: UserResponse }
    | { type: 'reset'; user: UserResponse }
  >(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') setModal({ type: 'create' });
    const role = searchParams.get('role');
    if (role) setFilter(f => ({ ...f, role }));
  }, [searchParams]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['manager-crew', filter],
    queryFn: () => adminApi.getAllUsers(filter),
    enabled: !!saccoId,
  });

  const crew = data?.data?.data ?? [];
  const meta = data?.data;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (req: CreateUserRequest) => adminApi.createUser(req),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['manager-crew'] });
      setModal(null);
      const pwd = res.data?.temporaryPassword;
      toast.success(pwd ? `Created! Temp password: ${pwd}` : 'Created! Credentials emailed.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create crew member.'),
  });

  const resetMut = useMutation({
    mutationFn: (email: string) => adminApi.resetPassword({ email, sendNewPassword: true }),
    onSuccess: () => { setModal(null); toast.success('Password reset. Credentials emailed.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const activateMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.activateUser(id, isActive),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['manager-crew'] }); toast.success(`User ${v.isActive ? 'activated' : 'deactivated'}.`); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const handleFilter = useCallback((k: keyof UserFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1, saccoId: saccoId ?? undefined }));
  }, [saccoId]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        input:focus,select:focus{border-color:#0891b2!important;}
        .crow:hover td{background:rgba(8,145,178,0.03);}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.3px' }}>Crew Members</h1>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            {meta?.totalCount ?? 0} crew members in {saccoName ?? 'your SACCO'}
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 8,
          background: T.teal, border: 'none',
          color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 15 }}>+</span> Add Crew Member
        </button>
      </div>

      {/* Role chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ label: 'All', value: '' }, { label: 'Drivers', value: 'driver' }, { label: 'Conductors', value: 'conductor' }].map(opt => (
          <button key={opt.value} onClick={() => handleFilter('role', opt.value)} style={{
            padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
            fontSize: 11, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.5px',
            background: filter.role === opt.value || (opt.value === '' && !filter.role) ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.03)',
            color: filter.role === opt.value || (opt.value === '' && !filter.role) ? T.teal : T.muted,
            border: `1px solid ${filter.role === opt.value || (opt.value === '' && !filter.role) ? 'rgba(8,145,178,0.4)' : T.border}`,
            transition: 'all 0.15s',
          }}>{opt.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 16 }}>
        <input placeholder="Search name, email or employee ID..." value={filter.search ?? ''} onChange={e => handleFilter('search', e.target.value)} style={{ ...inp, width: 280 }} />
        <select value={filter.isActive === undefined ? '' : String(filter.isActive)} onChange={e => handleFilter('isActive', e.target.value === '' ? undefined : e.target.value === 'true')} style={{ ...inp, width: 130 }}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button onClick={() => setFilter({ saccoId: saccoId ?? undefined, page: 1, pageSize: 15 })} style={{ ...inp, width: 'auto', padding: '8px 12px', cursor: 'pointer', color: T.muted }}>Clear</button>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px', height: 140, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : crew.length === 0 ? (
        <div style={{ padding: '64px 32px', textAlign: 'center', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 6 }}>No crew members yet</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Add drivers and conductors to your SACCO fleet.</div>
          <button onClick={() => setModal({ type: 'create' })} style={{ padding: '9px 20px', borderRadius: 8, background: T.teal, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            + Add First Crew Member
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {crew.map((u: UserResponse) => (
            <CrewCard
              key={u.id}
              user={u}
              onView={() => setModal({ type: 'view', user: u })}
              onEdit={() => setModal({ type: 'edit', user: u })}
              onReset={() => setModal({ type: 'reset', user: u })}
              onToggle={() => activateMut.mutate({ id: u.id, isActive: !u.isActive })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>Page {meta.page} / {meta.totalPages} · {meta.totalCount} members</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Pag label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
            <Pag label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'create' && (
        <CrewFormModal
          saccoId={saccoId ?? ''}
          onClose={() => setModal(null)}
          onSubmit={(req) => createMut.mutate(req)}
          loading={createMut.isPending}
        />
      )}
      {modal?.type === 'view' && (
        <ViewCrewModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'reset' && (
        <ResetModal
          user={modal.user}
          onClose={() => setModal(null)}
          onConfirm={() => resetMut.mutate(modal.user.email)}
          loading={resetMut.isPending}
        />
      )}
    </div>
  );
}

// ── Crew Card ─────────────────────────────────────────────────────────────────
function CrewCard({ user, onView, onEdit, onReset, onToggle }: {
  user: UserResponse;
  onView: () => void; onEdit: () => void;
  onReset: () => void; onToggle: () => void;
}) {
  const roleColors: Record<string, { bg: string; color: string }> = {
    driver:    { bg: 'rgba(8,145,178,0.1)',  color: '#0891b2' },
    conductor: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  };
  const rc = roleColors[user.role] ?? { bg: 'rgba(100,116,139,0.1)', color: '#64748b' };
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '16px',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = rc.color + '60')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: rc.bg, border: `2px solid ${rc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: rc.color, fontFamily: 'IBM Plex Mono' }}>{initials}</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: rc.color, marginTop: 1 }}>{user.employeeId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', background: rc.bg, color: rc.color }}>
            {user.role}
          </span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: user.isActive ? '#10b981' : '#ef4444', title: user.isActive ? 'Active' : 'Inactive' }} />
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <InfoRow icon="✉" value={user.email} mono />
        <InfoRow icon="📱" value={user.phoneNumber || '—'} />
        <InfoRow icon="🕐" value={user.lastLoginAt ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString('en-KE')}` : 'Never logged in'} />
      </div>

      {/* Warnings */}
      {user.forcePasswordChange && (
        <div style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 9, fontFamily: 'IBM Plex Mono', color: '#f59e0b', marginBottom: 10 }}>
          ⚠ Password change required on next login
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
        <ActionBtn label="View"   onClick={onView}   color={T.teal} />
        <ActionBtn label="Reset"  onClick={onReset}  color={T.warning} />
        <ActionBtn label={user.isActive ? 'Deactivate' : 'Activate'} onClick={onToggle} color={user.isActive ? T.danger : T.success} />
      </div>
    </div>
  );
}

function InfoRow({ icon, value, mono }: { icon: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 11, color: T.muted, fontFamily: mono ? 'IBM Plex Mono' : 'IBM Plex Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function ActionBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${color}30`,
      background: `${color}10`, color, fontSize: 10, fontFamily: 'IBM Plex Mono',
      cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.5px',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = `${color}20`)}
    onMouseLeave={e => (e.currentTarget.style.background = `${color}10`)}
    >{label}</button>
  );
}

// ── Create Crew Modal ─────────────────────────────────────────────────────────
function CrewFormModal({ saccoId, onClose, onSubmit, loading }: {
  saccoId: string;
  onClose: () => void;
  onSubmit: (req: CreateUserRequest) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    firstName: '', lastName: '', email: '',
    phoneNumber: '', role: 'driver' as 'driver' | 'conductor',
    sendCredentials: true,
  });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...f, saccoId, sendCredentials: f.sendCredentials });
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 460 }}>
        <MHead title="Add Crew Member" onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={inp} value={f.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="John" />
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={inp} value={f.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Kamau" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Email *</label>
              <input type="email" style={inp} value={f.email} onChange={e => set('email', e.target.value)} required placeholder="john.kamau@example.com" />
            </div>
            <div>
              <label style={lbl}>Phone *</label>
              <input style={inp} value={f.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} required placeholder="+254 712 345 678" />
            </div>
            <div>
              <label style={lbl}>Role *</label>
              <select style={inp} value={f.role} onChange={e => set('role', e.target.value)}>
                <option value="driver">Driver</option>
                <option value="conductor">Conductor</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={f.sendCredentials} onChange={e => set('sendCredentials', e.target.checked)} style={{ width: 13, height: 13, accentColor: T.teal }} />
                Send login credentials via email
              </label>
              {!f.sendCredentials && (
                <p style={{ fontSize: 10, color: T.warning, fontFamily: 'IBM Plex Mono', marginTop: 4 }}>
                  ⚠ Temporary password shown once after creation.
                </p>
              )}
            </div>
          </div>
          <MFoot onClose={onClose} loading={loading} label="Add Member" />
        </form>
      </div>
    </Overlay>
  );
}

// ── View Crew Modal ───────────────────────────────────────────────────────────
function ViewCrewModal({ user, onClose }: { user: UserResponse; onClose: () => void }) {
  const fields = [
    { label: 'Employee ID', value: user.employeeId },
    { label: 'Role',        value: user.role },
    { label: 'Email',       value: user.email },
    { label: 'Phone',       value: user.phoneNumber || '—' },
    { label: 'SACCO',       value: user.saccoName || '—' },
    { label: 'Last Login',  value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-KE') : 'Never' },
    { label: 'Created',     value: new Date(user.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) },
    { label: 'Pwd Status',  value: user.forcePasswordChange ? '⚠ Change required' : '✓ Set' },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420 }}>
        <MHead title={`${user.firstName} ${user.lastName}`} onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <div key={f.label} style={{ padding: '9px 11px', background: '#0a1628', borderRadius: 7, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.8px', color: T.muted, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 11.5, color: T.text, fontFamily: ['Employee ID', 'Email'].includes(f.label) ? 'IBM Plex Mono' : 'IBM Plex Sans' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, textAlign: 'right' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Close</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetModal({ user, onClose, onConfirm, loading }: { user: UserResponse; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 380 }}>
        <MHead title="Reset Password" onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
              A new temporary password will be emailed to <strong>{user.email}</strong>. They must change it on next login.
            </p>
          </div>
          <div style={{ padding: '10px 12px', background: '#0a1628', borderRadius: 7, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>Target user</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.teal }}>{user.employeeId} · {user.role}</div>
          </div>
        </div>
        <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 18px', borderRadius: 7, background: T.danger, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Sending...' : 'Reset & Email'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.17s ease' }}>
        {children}
      </div>
    </div>
  );
}
function MHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ padding: '15px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
    </div>
  );
}
function MFoot({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
    <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <button type="button" onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
      <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: 7, background: T.teal, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}
function Pag({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>{label}</button>;
}