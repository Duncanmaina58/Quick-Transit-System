/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import type {
  SaccoResponse, SaccoFilterRequest, CreateSaccoRequest,
  UpdateSaccoRequest, UserResponse,
} from '@/types/api';

// ── Shared style tokens ───────────────────────────────────────────────────────
const T = {
  surface:  '#161b26',
  border:   '#1e2535',
  amber:    '#f59e0b',
  text:     '#e2e8f0',
  muted:    '#64748b',
  danger:   '#ef4444',
  success:  '#10b981',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#0f1117',
  border: '1px solid #1e2535',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 13,
  fontFamily: 'Sora, sans-serif',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontFamily: 'DM Mono, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: '#64748b',
  marginBottom: 6,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SaccosPage() {
  const qc = useQueryClient();

  const [filter, setFilter] = useState<SaccoFilterRequest>({
    page: 1, pageSize: 15,
  });
  const [modal, setModal] = useState<
    null | { type: 'create' } | { type: 'edit'; sacco: SaccoResponse } | { type: 'assign'; sacco: SaccoResponse } | { type: 'view'; sacco: SaccoResponse }
  >(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['saccos', filter],
    queryFn: () => adminApi.getSaccos(filter),
  });

  const { data: managersData } = useQuery({
    queryKey: ['managers-list'],
    queryFn: () => adminApi.getAllUsers({ role: 'manager', isActive: true, page: 1, pageSize: 100 }),
  });

  const saccos   = data?.data?.data ?? [];
  const meta     = data?.data;
  const managers = managersData?.data?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (req: CreateSaccoRequest) => adminApi.createSacco(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saccos'] }); setModal(null); toast.success('SACCO created.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create SACCO.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateSaccoRequest }) => adminApi.updateSacco(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saccos'] }); setModal(null); toast.success('SACCO updated.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update SACCO.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ saccoId, managerId }: { saccoId: string; managerId: string }) =>
      adminApi.assignManager(saccoId, managerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saccos'] }); setModal(null); toast.success('Manager assigned.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to assign manager.'),
  });

  const removeMgrMutation = useMutation({
    mutationFn: (saccoId: string) => adminApi.removeManager(saccoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saccos'] }); toast.success('Manager removed.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to remove manager.'),
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.activateSacco(id, isActive),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['saccos'] }); toast.success(`SACCO ${v.isActive ? 'activated' : 'deactivated'}.`); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSacco(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saccos'] }); toast.success('SACCO deleted.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Cannot delete — check for active users/vehicles.'),
  });

  const handleFilterChange = useCallback((k: keyof SaccoFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        input:focus, select:focus { border-color: #f59e0b !important; }
        tr:hover td { background: rgba(245,158,11,0.03); }
        .action-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: '-0.4px' }}>SACCO Management</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
            {meta?.totalCount ?? 0} registered transport cooperatives
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 8,
          background: T.amber, border: 'none',
          color: '#000', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New SACCO
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        padding: '16px', background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 10,
        marginBottom: 20,
      }}>
        <input
          placeholder="Search name or reg number..."
          value={filter.search ?? ''}
          onChange={e => handleFilterChange('search', e.target.value)}
          style={{ ...inputStyle, width: 260 }}
        />
        <input
          placeholder="County..."
          value={filter.county ?? ''}
          onChange={e => handleFilterChange('county', e.target.value)}
          style={{ ...inputStyle, width: 160 }}
        />
        <select
          value={filter.isActive === undefined ? '' : String(filter.isActive)}
          onChange={e => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
          style={{ ...inputStyle, width: 130 }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={filter.hasManager === undefined ? '' : String(filter.hasManager)}
          onChange={e => handleFilterChange('hasManager', e.target.value === '' ? undefined : e.target.value === 'true')}
          style={{ ...inputStyle, width: 150 }}
        >
          <option value="">Any manager</option>
          <option value="true">Has manager</option>
          <option value="false">No manager</option>
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
              {['SACCO', 'Reg No.', 'County', 'Manager', 'Fleet / Crew', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '11px 18px', textAlign: 'left',
                  fontSize: 10, fontFamily: 'DM Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '1px', color: T.muted,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 18px' }}>
                      <div style={{ height: 14, borderRadius: 4, background: '#1e2535', width: j === 0 ? 140 : 80, animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : saccos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
                  No SACCOs found. Create your first one.
                </td>
              </tr>
            ) : saccos.map((s: SaccoResponse) => (
              <tr key={s.id} style={{ borderBottom: `1px solid rgba(30,37,53,0.6)`, transition: 'background 0.1s' }}>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</div>
                  {s.contactEmail && <div style={{ fontSize: 11, color: T.muted, fontFamily: 'DM Mono, monospace', marginTop: 1 }}>{s.contactEmail}</div>}
                </td>
                <td style={{ padding: '12px 18px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: T.amber }}>{s.registrationNumber}</td>
                <td style={{ padding: '12px 18px', fontSize: 12, color: T.muted }}>{s.county || '—'}</td>
                <td style={{ padding: '12px 18px' }}>
                  {s.managerName ? (
                    <div>
                      <div style={{ fontSize: 12, color: T.text }}>{s.managerName}</div>
                      <div style={{ fontSize: 10, color: T.muted, fontFamily: 'DM Mono, monospace' }}>{s.managerEmail}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setModal({ type: 'assign', sacco: s })}
                      style={{
                        fontSize: 11, fontFamily: 'DM Mono, monospace',
                        color: T.amber, background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                      }}
                    >+ Assign</button>
                  )}
                </td>
                <td style={{ padding: '12px 18px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: T.muted }}>
                  {s.totalVehicles} veh · {s.totalCrew} crew
                </td>
                <td style={{ padding: '12px 18px' }}><StatusBadge active={s.isActive} /></td>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ActionBtn icon="👁" label="View"   onClick={() => setModal({ type: 'view', sacco: s })} />
                    <ActionBtn icon="✏️" label="Edit"   onClick={() => setModal({ type: 'edit', sacco: s })} />
                    {s.managerName && (
                      <ActionBtn icon="🔗" label="Manager" onClick={() => setModal({ type: 'assign', sacco: s })} />
                    )}
                    <ActionBtn
                      icon={s.isActive ? '⏸' : '▶'}
                      label={s.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() => activateMutation.mutate({ id: s.id, isActive: !s.isActive })}
                    />
                    <ActionBtn
                      icon="🗑" label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${s.name}"? This cannot be undone.`))
                          deleteMutation.mutate(s.id);
                      }}
                      danger
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
              Page {meta.page} of {meta.totalPages} · {meta.totalCount} total
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
        <SaccoFormModal
          title="Create SACCO"
          managers={managers}
          onClose={() => setModal(null)}
          onSubmit={(req) => createMutation.mutate(req as CreateSaccoRequest)}
          loading={createMutation.isPending}
        />
      )}
      {modal?.type === 'edit' && (
        <SaccoFormModal
          title="Edit SACCO"
          initial={modal.sacco}
          managers={managers}
          onClose={() => setModal(null)}
          onSubmit={(req) => updateMutation.mutate({ id: modal.sacco.id, req: req as UpdateSaccoRequest })}
          loading={updateMutation.isPending}
        />
      )}
      {modal?.type === 'assign' && (
        <AssignManagerModal
          sacco={modal.sacco}
          managers={managers}
          onClose={() => setModal(null)}
          onAssign={(managerId) => assignMutation.mutate({ saccoId: modal.sacco.id, managerId })}
          onRemove={() => removeMgrMutation.mutate(modal.sacco.id)}
          loading={assignMutation.isPending || removeMgrMutation.isPending}
        />
      )}
      {modal?.type === 'view' && (
        <ViewSaccoModal sacco={modal.sacco} onClose={() => setModal(null)} />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ── Sacco Form Modal (create + edit) ─────────────────────────────────────────
function SaccoFormModal({ title, initial, managers, onClose, onSubmit, loading }: {
  title: string;
  initial?: SaccoResponse;
  managers: UserResponse[];
  onClose: () => void;
  onSubmit: (req: CreateSaccoRequest | UpdateSaccoRequest) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    registrationNumber: initial?.registrationNumber ?? '',
    address: initial?.address ?? '',
    county: initial?.county ?? '',
    contactPhone: initial?.contactPhone ?? '',
    contactEmail: initial?.contactEmail ?? '',
    description: initial?.description ?? '',
    managerId: initial?.managerId ?? '',
    isActive: initial?.isActive ?? true,
  });

  const handleChange = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...f, managerId: f.managerId || undefined } as any);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 560 }}>
        <ModalHeader title={title} onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>SACCO Name *</label>
              <input style={inputStyle} value={f.name} onChange={e => handleChange('name', e.target.value)} required placeholder="e.g. Metro Trans SACCO" />
            </div>
            <div>
              <label style={labelStyle}>Registration No. *</label>
              <input style={inputStyle} value={f.registrationNumber} onChange={e => handleChange('registrationNumber', e.target.value)} required placeholder="e.g. SACCO/NRB/001" />
            </div>
            <div>
              <label style={labelStyle}>County</label>
              <input style={inputStyle} value={f.county} onChange={e => handleChange('county', e.target.value)} placeholder="e.g. Nairobi" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={f.address} onChange={e => handleChange('address', e.target.value)} placeholder="Physical address" />
            </div>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input style={inputStyle} value={f.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} placeholder="+254 700 000 000" />
            </div>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input type="email" style={inputStyle} value={f.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} placeholder="office@sacco.co.ke" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={f.description} onChange={e => handleChange('description', e.target.value)} placeholder="Optional description" />
            </div>
            {!initial && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Assign Manager (optional)</label>
                <select style={inputStyle} value={f.managerId} onChange={e => handleChange('managerId', e.target.value)}>
                  <option value="">Select a manager...</option>
                  {managers.map((m: UserResponse) => (
                    <option key={m.id} value={m.id}>{m.fullName} — {m.email}</option>
                  ))}
                </select>
              </div>
            )}
            {initial && (
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={String(f.isActive)} onChange={e => handleChange('isActive', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <ModalFooter onClose={onClose} loading={loading} submitLabel={initial ? 'Save Changes' : 'Create SACCO'} />
        </form>
      </div>
    </Overlay>
  );
}

// ── Assign Manager Modal ──────────────────────────────────────────────────────
function AssignManagerModal({ sacco, managers, onClose, onAssign, onRemove, loading }: {
  sacco: SaccoResponse;
  managers: UserResponse[];
  onClose: () => void;
  onAssign: (managerId: string) => void;
  onRemove: () => void;
  loading: boolean;
}) {
  const [selectedId, setSelectedId] = useState(sacco.managerId ?? '');

  // Managers not already managing another sacco (or this sacco's current manager)
  const available = managers.filter(m => !m.saccoId || m.saccoId === sacco.id);

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 460 }}>
        <ModalHeader title="Assign Manager" onClose={onClose} />
        <div style={{ padding: '20px 24px' }}>
          {sacco.managerName && (
            <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: T.amber, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Manager</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{sacco.managerName}</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: 'DM Mono, monospace' }}>{sacco.managerEmail}</div>
            </div>
          )}

          <label style={labelStyle}>Select New Manager</label>
          <select
            style={{ ...inputStyle, marginBottom: 20 }}
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            <option value="">Choose a manager...</option>
            {available.map(m => (
              <option key={m.id} value={m.id}>
                {m.fullName} — {m.email} {m.saccoId === sacco.id ? '(current)' : ''}
              </option>
            ))}
          </select>

          {available.length === 0 && (
            <p style={{ fontSize: 12, color: T.muted, fontFamily: 'DM Mono, monospace', marginBottom: 16 }}>
              No available managers. Create a manager account first.
            </p>
          )}
        </div>
        <div style={{ padding: '12px 24px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {sacco.managerName && (
            <button
              onClick={onRemove}
              disabled={loading}
              style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.danger, fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
            >
              Remove Manager
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={() => selectedId && onAssign(selectedId)}
              disabled={!selectedId || loading}
              style={{ padding: '9px 18px', borderRadius: 8, background: T.amber, border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: selectedId ? 'pointer' : 'not-allowed', opacity: selectedId ? 1 : 0.5 }}
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ── View Sacco Modal ──────────────────────────────────────────────────────────
function ViewSaccoModal({ sacco, onClose }: { sacco: SaccoResponse; onClose: () => void }) {
  const fields = [
    { label: 'Registration No.', value: sacco.registrationNumber },
    { label: 'County',           value: sacco.county || '—' },
    { label: 'Address',          value: sacco.address || '—' },
    { label: 'Contact Phone',    value: sacco.contactPhone || '—' },
    { label: 'Contact Email',    value: sacco.contactEmail || '—' },
    { label: 'Manager',          value: sacco.managerName || 'Not assigned' },
    { label: 'Manager Email',    value: sacco.managerEmail || '—' },
    { label: 'Total Vehicles',   value: String(sacco.totalVehicles) },
    { label: 'Total Crew',       value: String(sacco.totalCrew) },
    { label: 'Created',          value: new Date(sacco.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 500 }}>
        <ModalHeader title={sacco.name} onClose={onClose} />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}><StatusBadge active={sacco.isActive} /></div>
          {sacco.description && (
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>{sacco.description}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(f => (
              <div key={f.label} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.8px', color: T.muted, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: f.label.includes('Reg') || f.label.includes('Email') ? 'DM Mono, monospace' : 'Sora, sans-serif' }}>{f.value}</div>
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

// ── Reusable UI primitives ────────────────────────────────────────────────────
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

function ActionBtn({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="action-btn"
      style={{
        padding: '5px 7px', borderRadius: 6, border: `1px solid ${T.border}`,
        background: 'transparent', cursor: 'pointer', fontSize: 13, opacity: 0.6,
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; if (danger) e.currentTarget.style.borderColor = T.danger; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = T.border; }}
    >{icon}</button>
  );
}

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '6px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
    >{label}</button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 10,
      fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px',
      background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      color: active ? T.success : T.danger,
      border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}