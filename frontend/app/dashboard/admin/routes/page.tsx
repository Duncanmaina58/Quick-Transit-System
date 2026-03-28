/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import type {
  RouteResponse,
  RouteFilterRequest,
  CreateRouteRequest,
  UpdateRouteRequest,
} from '@/types/api';

// ── Design tokens (admin: dark slate + amber) ─────────────────────────────
const T = {
  bg:      '#0f1117',
  surface: '#161b26',
  card:    '#161b26',
  border:  '#1e2535',
  amber:   '#f59e0b',
  text:    '#e2e8f0',
  muted:   '#64748b',
  success: '#10b981',
  danger:  '#ef4444',
  cyan:    '#06b6d4',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0f1117', border: '1px solid #1e2535',
  borderRadius: 8, color: '#e2e8f0',
  fontSize: 13, fontFamily: 'Sora, sans-serif', outline: 'none',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10,
  fontFamily: 'DM Mono, monospace',
  textTransform: 'uppercase', letterSpacing: '0.8px',
  color: '#64748b', marginBottom: 6,
};

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminRoutesPage() {
  const qc = useQueryClient();

  const [filter, setFilter] = useState<RouteFilterRequest>({ page: 1, pageSize: 20 });
  const [modal, setModal] = useState<
    | null
    | { type: 'create' }
    | { type: 'edit';   route: RouteResponse }
    | { type: 'view';   route: RouteResponse }
    | { type: 'delete'; route: RouteResponse }
  >(null);

  // ── Queries ───────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin-routes', filter],
    queryFn:  () => adminApi.getRoutes(filter),
  });

  const routes = data?.data?.data  ?? [];
  const meta   = data?.data;

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (req: CreateRouteRequest) => adminApi.createRoute(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-summaries'] });
      setModal(null);
      toast.success('Route created.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create route.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateRouteRequest }) =>
      adminApi.updateRoute(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-summaries'] });
      setModal(null);
      toast.success('Route updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update route.'),
  });

  const activateMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.activateRoute(id, isActive),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      toast.success(`Route ${v.isActive ? 'activated' : 'deactivated'}.`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteRoute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-summaries'] });
      setModal(null);
      toast.success('Route deleted.');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Cannot delete — remove vehicle assignments first.'),
  });

  const handleFilter = useCallback((k: keyof RouteFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1300 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        input:focus, select:focus, textarea:focus { border-color: #f59e0b !important; }
        .rrow:hover td { background: rgba(245,158,11,0.025); }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96) translateY(6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.4px' }}>
            Route Management
          </h1>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
            {meta?.totalCount ?? 0} routes · admin creates &amp; publishes, managers assign to vehicles
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8,
            background: T.amber, border: 'none',
            color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> New Route
        </button>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Routes',    value: meta?.totalCount ?? '—',                          color: T.amber   },
          { label: 'Active',          value: routes.filter((r: RouteResponse) => r.isActive).length,  color: T.success },
          { label: 'Inactive',        value: routes.filter((r: RouteResponse) => !r.isActive).length, color: T.danger  },
          { label: 'Assigned Vehicles', value: routes.reduce((s: number, r: RouteResponse) => s + (r.totalVehicles ?? 0), 0), color: T.cyan },
        ].map((s, i) => (
          <div key={s.label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            animation: `fadeUp .3s ease ${i * 50}ms both`,
          }}>
            <div style={{ height: 2, background: s.color, position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '10px 10px 0 0' }} />
            <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '12px 14px', background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 18,
      }}>
        <input
          placeholder="Search name, code, origin, destination..."
          value={filter.search ?? ''}
          onChange={e => handleFilter('search', e.target.value)}
          style={{ ...inp, width: 320 }}
        />
        <select
          value={filter.isActive === undefined ? '' : String(filter.isActive)}
          onChange={e => handleFilter('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
          style={{ ...inp, width: 140 }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          onClick={() => setFilter({ page: 1, pageSize: 20 })}
          style={{ ...inp, width: 'auto', padding: '9px 14px', cursor: 'pointer', color: T.muted }}
        >
          Clear
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Code', 'Route Name', 'Origin → Destination', 'Distance', 'Est. Time', 'Vehicles', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: 9, fontFamily: 'DM Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '1px', color: T.muted,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 12, borderRadius: 3, background: '#1e2535', width: [50, 120, 160, 60, 60, 40, 60, 80][j], animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '56px', textAlign: 'center', color: T.muted, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                  No routes yet. Create your first route to get started.
                </td>
              </tr>
            ) : routes.map((r: RouteResponse) => (
              <RouteRow
                key={r.id}
                route={r}
                onView={() => setModal({ type: 'view', route: r })}
                onEdit={() => setModal({ type: 'edit', route: r })}
                onToggle={() => activateMut.mutate({ id: r.id, isActive: !r.isActive })}
                onDelete={() => setModal({ type: 'delete', route: r })}
              />
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: T.muted }}>
              Page {meta.page} / {meta.totalPages} · {meta.totalCount} routes
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pag label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
              <Pag label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'create' && (
        <RouteFormModal
          title="Create Route"
          onClose={() => setModal(null)}
          onSubmit={req => createMut.mutate(req)}
          loading={createMut.isPending}
        />
      )}
      {modal?.type === 'edit' && (
        <RouteFormModal
          title="Edit Route"
          initial={modal.route}
          onClose={() => setModal(null)}
          onSubmit={req => updateMut.mutate({ id: modal.route.id, req: { ...req, isActive: modal.route.isActive } })}
          loading={updateMut.isPending}
        />
      )}
      {modal?.type === 'view' && (
        <ViewRouteModal route={modal.route} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          route={modal.route}
          onClose={() => setModal(null)}
          onConfirm={() => deleteMut.mutate(modal.route.id)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}

// ── Route Table Row ───────────────────────────────────────────────────────────
function RouteRow({ route, onView, onEdit, onToggle, onDelete }: {
  route: RouteResponse;
  onView: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  return (
    <tr className="rrow" style={{ borderBottom: `1px solid rgba(30,37,53,.6)`, transition: 'background .1s' }}>
      {/* Code */}
      <td style={{ padding: '11px 16px' }}>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600,
          color: '#f59e0b', background: 'rgba(245,158,11,.1)',
          padding: '2px 8px', borderRadius: 4,
        }}>{route.routeCode}</span>
      </td>

      {/* Name */}
      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
        {route.name}
      </td>

      {/* Origin → Dest */}
      <td style={{ padding: '11px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#e2e8f0' }}>
          <span>{route.origin}</span>
          <span style={{ color: '#64748b', fontSize: 10 }}>→</span>
          <span>{route.destination}</span>
        </div>
        {route.stops && (
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
            {(() => {
              try { return `${JSON.parse(route.stops).length} stops`; }
              catch { return route.stops.split(',').length + ' stops'; }
            })()}
          </div>
        )}
      </td>

      {/* Distance */}
      <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#64748b' }}>
        {route.distanceKm ? `${route.distanceKm} km` : '—'}
      </td>

      {/* Est. time */}
      <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#64748b' }}>
        {route.estimatedMinutes ? `${route.estimatedMinutes} min` : '—'}
      </td>

      {/* Vehicles */}
      <td style={{ padding: '11px 16px' }}>
        <span style={{
          fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 600,
          color: route.totalVehicles > 0 ? '#06b6d4' : '#64748b',
        }}>
          {route.totalVehicles}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '11px 16px' }}>
        <StatusPill active={route.isActive} />
      </td>

      {/* Actions */}
      <td style={{ padding: '11px 16px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <ABtn icon="👁"  title="View"       onClick={onView} />
          <ABtn icon="✏️" title="Edit"       onClick={onEdit} />
          <ABtn icon={route.isActive ? '⏸' : '▶'} title={route.isActive ? 'Deactivate' : 'Activate'} onClick={onToggle} />
          <ABtn icon="🗑"  title="Delete"     onClick={onDelete} danger />
        </div>
      </td>
    </tr>
  );
}

// ── Route Form Modal ──────────────────────────────────────────────────────────
function RouteFormModal({ title, initial, onClose, onSubmit, loading }: {
  title: string;
  initial?: RouteResponse;
  onClose: () => void;
  onSubmit: (req: CreateRouteRequest) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    name:               initial?.name               ?? '',
    routeCode:          initial?.routeCode           ?? '',
    origin:             initial?.origin              ?? '',
    destination:        initial?.destination         ?? '',
    description:        initial?.description         ?? '',
    distanceKm:         initial?.distanceKm?.toString()  ?? '',
    estimatedMinutes:   initial?.estimatedMinutes?.toString() ?? '',
    stops:              initial?.stops               ?? '',
  });

  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name:             f.name.trim(),
      routeCode:        f.routeCode.trim().toUpperCase(),
      origin:           f.origin.trim(),
      destination:      f.destination.trim(),
      description:      f.description.trim() || undefined,
      distanceKm:       f.distanceKm ? parseFloat(f.distanceKm) : undefined,
      estimatedMinutes: f.estimatedMinutes ? parseInt(f.estimatedMinutes) : undefined,
      stops:            f.stops.trim() || undefined,
    });
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 580 }}>
        <MHead title={title} onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Route Code */}
            <div>
              <label style={lbl}>Route Code *</label>
              <input
                style={inp} required
                value={f.routeCode}
                onChange={e => set('routeCode', e.target.value)}
                placeholder="e.g. NRB-01"
              />
              <p style={{ fontSize: 9, color: '#64748b', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
                Auto-uppercased. Must be unique.
              </p>
            </div>

            {/* Name */}
            <div>
              <label style={lbl}>Route Name *</label>
              <input
                style={inp} required
                value={f.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. CBD – Westlands Express"
              />
            </div>

            {/* Origin */}
            <div>
              <label style={lbl}>Origin *</label>
              <input
                style={inp} required
                value={f.origin}
                onChange={e => set('origin', e.target.value)}
                placeholder="e.g. Nairobi CBD"
              />
            </div>

            {/* Destination */}
            <div>
              <label style={lbl}>Destination *</label>
              <input
                style={inp} required
                value={f.destination}
                onChange={e => set('destination', e.target.value)}
                placeholder="e.g. Westlands"
              />
            </div>

            {/* Distance */}
            <div>
              <label style={lbl}>Distance (km)</label>
              <input
                type="number" style={inp} min="0" step="0.1"
                value={f.distanceKm}
                onChange={e => set('distanceKm', e.target.value)}
                placeholder="e.g. 8.5"
              />
            </div>

            {/* Estimated minutes */}
            <div>
              <label style={lbl}>Est. Duration (minutes)</label>
              <input
                type="number" style={inp} min="1"
                value={f.estimatedMinutes}
                onChange={e => set('estimatedMinutes', e.target.value)}
                placeholder="e.g. 25"
              />
            </div>

            {/* Stops */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Stops (comma-separated)</label>
              <input
                style={inp}
                value={f.stops}
                onChange={e => set('stops', e.target.value)}
                placeholder="e.g. Globe Roundabout, Museum Hill, Westgate"
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Description</label>
              <textarea
                style={{ ...inp, height: 72, resize: 'vertical' }}
                value={f.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Optional route description..."
              />
            </div>
          </div>
          <MFoot onClose={onClose} loading={loading} label={initial ? 'Save Changes' : 'Create Route'} amber />
        </form>
      </div>
    </Overlay>
  );
}

// ── View Route Modal ──────────────────────────────────────────────────────────
function ViewRouteModal({ route, onClose }: { route: RouteResponse; onClose: () => void }) {
  const stops = (() => {
    if (!route.stops) return [];
    try { return JSON.parse(route.stops) as string[]; }
    catch { return route.stops.split(',').map(s => s.trim()); }
  })();

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 520 }}>
        <MHead
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f59e0b', background: 'rgba(245,158,11,.12)', padding: '1px 8px', borderRadius: 4 }}>{route.routeCode}</span>
              {route.name}
            </span>
          }
          onClose={onClose}
        />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}><StatusPill active={route.isActive} /></div>

          {/* Route path visual */}
          <div style={{
            padding: '16px', borderRadius: 10,
            background: '#0f1117', border: '1px solid #1e2535',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #064e3b' }} />
                {stops.length > 0 && <div style={{ width: 2, background: '#1e2535', flex: 1, minHeight: 16 }} />}
                {stops.map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748b' }} />
                    {i < stops.length - 1 && <div style={{ width: 2, background: '#1e2535', height: 12 }} />}
                  </div>
                ))}
                {stops.length > 0 && <div style={{ width: 2, background: '#1e2535', height: 12 }} />}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #7f1d1d' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{route.origin}</div>
                {stops.map((stop, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>
                    {stop}
                  </div>
                ))}
                {stops.length > 0 && <div style={{ marginTop: 4 }} />}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{route.destination}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Distance',    value: route.distanceKm ? `${route.distanceKm} km` : '—' },
              { label: 'Est. Time',   value: route.estimatedMinutes ? `${route.estimatedMinutes} min` : '—' },
              { label: 'Vehicles',    value: String(route.totalVehicles) },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2535' }}>
                <div style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: '#e2e8f0' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {route.description && (
            <div style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2535' }}>
              <div style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>Description</div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{route.description}</p>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #1e2535', textAlign: 'right' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 18px', cursor: 'pointer', color: '#64748b' }}>Close</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ route, onClose, onConfirm, loading }: {
  route: RouteResponse; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <MHead title="Delete Route" onClose={onClose} />
        <div style={{ padding: '20px 24px' }}>
          {route.totalVehicles > 0 && (
            <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.6 }}>
                ⚠ This route has <strong>{route.totalVehicles} vehicle{route.totalVehicles > 1 ? 's' : ''}</strong> assigned. You must reassign them before deleting.
              </p>
            </div>
          )}
          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
              This will permanently delete route <strong>[{route.routeCode}] {route.name}</strong>. This action cannot be undone.
            </p>
          </div>
          <div style={{ padding: '12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2535' }}>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#f59e0b' }}>{route.routeCode}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>{route.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{route.origin} → {route.destination}</div>
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading || route.totalVehicles > 0}
            style={{
              padding: '8px 18px', borderRadius: 8, background: '#ef4444',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: route.totalVehicles > 0 ? 'not-allowed' : 'pointer',
              opacity: loading || route.totalVehicles > 0 ? 0.5 : 1,
            }}
          >
            {loading ? 'Deleting...' : 'Delete Route'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Shared primitives (admin amber theme) ─────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: '#161b26', border: '1px solid #1e2535', borderRadius: 14, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .17s ease' }}>
        {children}
      </div>
    </div>
  );
}

function MHead({ title, onClose }: { title: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e2535', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-.3px' }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
    </div>
  );
}

function MFoot({ onClose, loading, label, amber }: { onClose: () => void; loading: boolean; label: string; amber?: boolean }) {
  return (
    <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #1e2535', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <button type="button" onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
      <button
        type="submit" disabled={loading}
        style={{ padding: '9px 20px', borderRadius: 8, background: amber ? '#f59e0b' : '#3b82f6', border: 'none', color: amber ? '#000' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? .6 : 1 }}
      >
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 9,
      fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '.5px',
      background: active ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function ABtn({ icon, title, onClick, danger }: { icon: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title} onClick={onClick}
      style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid #1e2535', background: 'transparent', cursor: 'pointer', fontSize: 12, opacity: .6, transition: 'opacity .15s' }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; if (danger) e.currentTarget.style.borderColor = '#ef4444'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '.6'; e.currentTarget.style.borderColor = '#1e2535'; }}
    >{icon}</button>
  );
}

function Pag({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '6px 12px', borderRadius: 6, background: 'transparent', border: '1px solid #1e2535', color: disabled ? '#64748b' : '#e2e8f0', fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1 }}>
      {label}
    </button>
  );
}