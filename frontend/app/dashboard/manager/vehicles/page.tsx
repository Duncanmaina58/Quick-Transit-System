/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { managerApi } from '@/lib/api/manager';
import { adminApi } from '@/lib/api/admin';
import { AuthService } from '@/lib/utils/auth';
import type {
  VehicleResponse, VehicleFilterRequest, CreateVehicleRequest,
  UpdateVehicleRequest, AssignCrewRequest, RouteSummaryResponse, UserResponse,
} from '@/types/api';

const T = {
  bg: '#0d1b2a', surface: '#0a1628', card: '#0f2033',
  border: '#1e3a5f', teal: '#0891b2', text: '#e2eaf3',
  muted: '#5b7fa0', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
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

const STATUS_OPTIONS = ['Active', 'Maintenance', 'Inactive', 'Suspended'];
const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981', Maintenance: '#f59e0b', Inactive: '#ef4444', Suspended: '#64748b',
};

export default function VehiclesPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const saccoId = AuthService.getSaccoId();

  const [filter, setFilter] = useState<VehicleFilterRequest>({ page: 1, pageSize: 15 });
  const [modal, setModal] = useState<
    null
    | { type: 'create' }
    | { type: 'edit';         vehicle: VehicleResponse }
    | { type: 'assign-crew'; vehicle: VehicleResponse }
    | { type: 'assign-route';vehicle: VehicleResponse }
    | { type: 'status';       vehicle: VehicleResponse }
    | { type: 'view';         vehicle: VehicleResponse }
  >(null);

  // Open create modal from query param (e.g. ?action=new from dashboard quick action)
  useEffect(() => {
    if (searchParams.get('action') === 'new') setModal({ type: 'create' });
  }, [searchParams]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['manager-vehicles', filter],
    queryFn: () => managerApi.getVehicles(filter),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes-summaries'],
    queryFn: () => managerApi.getRouteSummaries(),
  });

  const { data: crewData } = useQuery({
    queryKey: ['manager-crew', saccoId],
    queryFn: () => adminApi.getAllUsers({ saccoId: saccoId ?? undefined, isActive: true, page: 1, pageSize: 100 }),
    enabled: !!saccoId,
  });

  const vehicles = data?.data?.data ?? [];
  const meta     = data?.data;
  const routes   = routesData?.data?.data ?? [];
  const crew     = crewData?.data?.data ?? [];
  const drivers  = crew.filter((u: UserResponse) => u.role === 'driver');
  const conductors = crew.filter((u: UserResponse) => u.role === 'conductor');

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (req: CreateVehicleRequest) => managerApi.createVehicle(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); setModal(null); toast.success('Vehicle registered.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to register vehicle.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateVehicleRequest }) => managerApi.updateVehicle(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); setModal(null); toast.success('Vehicle updated.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update.'),
  });

  const crewMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: AssignCrewRequest }) => managerApi.assignCrew(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); setModal(null); toast.success('Crew assigned.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to assign crew.'),
  });

  const routeMut = useMutation({
    mutationFn: ({ id, routeId }: { id: string; routeId: string | null }) =>
      managerApi.assignRoute(id, { routeId: routeId ?? undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); setModal(null); toast.success('Route assigned.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to assign route.'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      managerApi.updateVehicleStatus(id, { status: status as any, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); setModal(null); toast.success('Status updated.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => managerApi.deleteVehicle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-vehicles'] }); toast.success('Vehicle removed.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Cannot delete — has trip records.'),
  });

  const handleFilter = useCallback((k: keyof VehicleFilterRequest, v: any) => {
    setFilter((f: any) => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1320 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        input:focus,select:focus{border-color:#0891b2!important;}
        .vrow:hover td{background:rgba(8,145,178,0.03);}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.3px' }}>Vehicles</h1>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            {meta?.totalCount ?? 0} registered in your SACCO
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 8,
          background: T.teal, border: 'none',
          color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 15 }}>+</span> Register Vehicle
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 16 }}>
        <input placeholder="Search plate, make, model..." value={filter.search ?? ''} onChange={e => handleFilter('search', e.target.value)} style={{ ...inp, width: 240 }} />
        <select value={filter.status ?? ''} onChange={e => handleFilter('status', e.target.value)} style={{ ...inp, width: 130 }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.hasDriver === undefined ? '' : String(filter.hasDriver)} onChange={e => handleFilter('hasDriver', e.target.value === '' ? undefined : e.target.value === 'true')} style={{ ...inp, width: 140 }}>
          <option value="">Any driver</option>
          <option value="true">Has driver</option>
          <option value="false">No driver</option>
        </select>
        <select value={filter.hasConductor === undefined ? '' : String(filter.hasConductor)} onChange={e => handleFilter('hasConductor', e.target.value === '' ? undefined : e.target.value === 'true')} style={{ ...inp, width: 160 }}>
          <option value="">Any conductor</option>
          <option value="true">Has conductor</option>
          <option value="false">No conductor</option>
        </select>
        <button onClick={() => setFilter({ page: 1, pageSize: 15 })} style={{ ...inp, width: 'auto', padding: '8px 12px', cursor: 'pointer', color: T.muted }}>Clear</button>
      </div>

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Plate', 'Vehicle', 'Capacity', 'Driver', 'Conductor', 'Route', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                <td key={j} style={{ padding: '13px 16px' }}>
                  <div style={{ height: 12, borderRadius: 3, background: '#1e3a5f', width: [80, 110, 40, 90, 90, 70, 60, 80][j], animation: 'pulse 1.5s infinite' }} />
                </td>
              ))}</tr>
            )) : vehicles.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
                No vehicles registered. Add your first one.
              </td></tr>
            ) : vehicles.map((v: VehicleResponse) => (
              <tr key={v.id} className="vrow" style={{ borderBottom: `1px solid rgba(30,58,95,0.5)`, transition: 'background 0.1s' }}>
                <td style={{ padding: '11px 16px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.teal, fontWeight: 500 }}>{v.registrationPlate}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{v.make} {v.model}</div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: 'IBM Plex Mono' }}>{v.year} · {v.color}</div>
                </td>
                <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'IBM Plex Mono', color: T.muted }}>{v.capacity}</td>
                <td style={{ padding: '11px 16px' }}>
                  {v.driverName
                    ? <div><div style={{ fontSize: 11, color: T.text }}>{v.driverName}</div><div style={{ fontSize: 10, color: T.muted, fontFamily: 'IBM Plex Mono' }}>{v.driverPhone}</div></div>
                    : <QuickAssign label="+ Driver" onClick={() => setModal({ type: 'assign-crew', vehicle: v })} />}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  {v.conductorName
                    ? <div><div style={{ fontSize: 11, color: T.text }}>{v.conductorName}</div><div style={{ fontSize: 10, color: T.muted, fontFamily: 'IBM Plex Mono' }}>{v.conductorPhone}</div></div>
                    : <QuickAssign label="+ Conductor" onClick={() => setModal({ type: 'assign-crew', vehicle: v })} />}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  {v.routeCode
                    ? <div>
                        <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '1px 6px', borderRadius: 4, display: 'inline-block' }}>{v.routeCode}</div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{v.routeName}</div>
                      </div>
                    : <QuickAssign label="+ Route" onClick={() => setModal({ type: 'assign-route', vehicle: v })} />}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <button onClick={() => setModal({ type: 'status', vehicle: v })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <StatusPill status={v.status} />
                  </button>
                  {v.maintenanceDue && <div style={{ fontSize: 9, color: T.warning, fontFamily: 'IBM Plex Mono', marginTop: 2 }}>⚠ Service due</div>}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <ABtn icon="👁"  title="View"         onClick={() => setModal({ type: 'view', vehicle: v })} />
                    <ABtn icon="✏️" title="Edit"         onClick={() => setModal({ type: 'edit', vehicle: v })} />
                    <ABtn icon="👥" title="Assign Crew"  onClick={() => setModal({ type: 'assign-crew', vehicle: v })} />
                    <ABtn icon="📍" title="Assign Route" onClick={() => setModal({ type: 'assign-route', vehicle: v })} />
                    <ABtn icon="🗑" title="Delete" danger onClick={() => { if (confirm(`Remove ${v.registrationPlate}?`)) deleteMut.mutate(v.id); }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta && meta.totalPages > 1 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>Page {meta.page} / {meta.totalPages} · {meta.totalCount} vehicles</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pag label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter((f: { page: any; }) => ({ ...f, page: (f.page ?? 1) - 1 }))} />
              <Pag label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter((f: { page: any; }) => ({ ...f, page: (f.page ?? 1) + 1 }))} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <VehicleFormModal
          initial={modal.type === 'edit' ? modal.vehicle : undefined}
          routes={routes}
          drivers={drivers}
          conductors={conductors}
          onClose={() => setModal(null)}
          onSubmit={(req) => {
            if (modal.type === 'edit') updateMut.mutate({ id: modal.vehicle.id, req: req as UpdateVehicleRequest });
            else createMut.mutate(req as CreateVehicleRequest);
          }}
          loading={createMut.isPending || updateMut.isPending}
        />
      )}
      {modal?.type === 'assign-crew' && (
        <AssignCrewModal
          vehicle={modal.vehicle}
          drivers={drivers}
          conductors={conductors}
          onClose={() => setModal(null)}
          onSubmit={(req) => crewMut.mutate({ id: modal.vehicle.id, req })}
          loading={crewMut.isPending}
        />
      )}
      {modal?.type === 'assign-route' && (
        <AssignRouteModal
          vehicle={modal.vehicle}
          routes={routes}
          onClose={() => setModal(null)}
          onSubmit={(routeId) => routeMut.mutate({ id: modal.vehicle.id, routeId })}
          loading={routeMut.isPending}
        />
      )}
      {modal?.type === 'status' && (
        <StatusModal
          vehicle={modal.vehicle}
          onClose={() => setModal(null)}
          onSubmit={(status, notes) => statusMut.mutate({ id: modal.vehicle.id, status, notes })}
          loading={statusMut.isPending}
        />
      )}
      {modal?.type === 'view' && <ViewVehicleModal vehicle={modal.vehicle} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Vehicle Form Modal ────────────────────────────────────────────────────────
function VehicleFormModal({ initial, routes, drivers, conductors, onClose, onSubmit, loading }: {
  initial?: VehicleResponse;
  routes: RouteSummaryResponse[];
  drivers: UserResponse[];
  conductors: UserResponse[];
  onClose: () => void;
  onSubmit: (req: CreateVehicleRequest | UpdateVehicleRequest) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    registrationPlate: initial?.registrationPlate ?? '',
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    capacity: initial?.capacity ?? 14,
    color: initial?.color ?? '',
    routeId: initial?.routeId ?? '',
    driverId: initial?.driverId ?? '',
    conductorId: initial?.conductorId ?? '',
    notes: initial?.notes ?? '',
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      registrationPlate: f.registrationPlate,
      make: f.make, model: f.model,
      year: Number(f.year), capacity: Number(f.capacity),
      color: f.color, notes: f.notes,
      routeId: f.routeId || undefined,
      driverId: f.driverId || undefined,
      conductorId: f.conductorId || undefined,
      ...(initial ? { isActive: f.isActive } : {}),
    } as any);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 520 }}>
        <MHead title={initial ? 'Edit Vehicle' : 'Register Vehicle'} onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Registration Plate *</label>
              <input style={inp} value={f.registrationPlate} onChange={e => set('registrationPlate', e.target.value)} required placeholder="e.g. KCA 123A" />
            </div>
            <div>
              <label style={lbl}>Make *</label>
              <input style={inp} value={f.make} onChange={e => set('make', e.target.value)} required placeholder="Toyota" />
            </div>
            <div>
              <label style={lbl}>Model *</label>
              <input style={inp} value={f.model} onChange={e => set('model', e.target.value)} required placeholder="Hiace" />
            </div>
            <div>
              <label style={lbl}>Year</label>
              <input type="number" style={inp} value={f.year} onChange={e => set('year', e.target.value)} min={2000} max={new Date().getFullYear() + 1} />
            </div>
            <div>
              <label style={lbl}>Capacity</label>
              <input type="number" style={inp} value={f.capacity} onChange={e => set('capacity', e.target.value)} min={1} max={100} />
            </div>
            <div>
              <label style={lbl}>Color</label>
              <input style={inp} value={f.color} onChange={e => set('color', e.target.value)} placeholder="White" />
            </div>
            {!initial && (
              <div>
                <label style={lbl}>Assign Route</label>
                <select style={inp} value={f.routeId} onChange={e => set('routeId', e.target.value)}>
                  <option value="">Select route...</option>
                  {routes.map((r: RouteSummaryResponse) => <option key={r.id} value={r.id}>[{r.routeCode}] {r.origin} → {r.destination}</option>)}
                </select>
              </div>
            )}
            {!initial && (
              <>
                <div>
                  <label style={lbl}>Assign Driver</label>
                  <select style={inp} value={f.driverId} onChange={e => set('driverId', e.target.value)}>
                    <option value="">Select driver...</option>
                    {drivers.map((d: UserResponse) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Assign Conductor</label>
                  <select style={inp} value={f.conductorId} onChange={e => set('conductorId', e.target.value)}>
                    <option value="">Select conductor...</option>
                    {conductors.map((c: UserResponse) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>
              </>
            )}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Notes</label>
              <input style={inp} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <MFoot onClose={onClose} loading={loading} label={initial ? 'Save Changes' : 'Register'} />
        </form>
      </div>
    </Overlay>
  );
}

// ── Assign Crew Modal ─────────────────────────────────────────────────────────
function AssignCrewModal({ vehicle, drivers, conductors, onClose, onSubmit, loading }: {
  vehicle: VehicleResponse;
  drivers: UserResponse[];
  conductors: UserResponse[];
  onClose: () => void;
  onSubmit: (req: AssignCrewRequest) => void;
  loading: boolean;
}) {
  const [driverId, setDriverId]   = useState(vehicle.driverId ?? '');
  const [conductorId, setConductorId] = useState(vehicle.conductorId ?? '');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420 }}>
        <MHead title={`Assign Crew — ${vehicle.registrationPlate}`} onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          {/* Current assignments */}
          {(vehicle.driverName || vehicle.conductorName) && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)', marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.teal, marginBottom: 6 }}>Current Crew</div>
              {vehicle.driverName && <div style={{ fontSize: 11, color: T.text }}>Driver: <strong>{vehicle.driverName}</strong></div>}
              {vehicle.conductorName && <div style={{ fontSize: 11, color: T.text, marginTop: 2 }}>Conductor: <strong>{vehicle.conductorName}</strong></div>}
            </div>
          )}
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={lbl}>Driver</label>
              <select style={inp} value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">— Unassign driver —</option>
                {drivers.map((d: UserResponse) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} ({d.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Conductor</label>
              <select style={inp} value={conductorId} onChange={e => setConductorId(e.target.value)}>
                <option value="">— Unassign conductor —</option>
                {conductors.map((c: UserResponse) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.employeeId})</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button onClick={() => onSubmit({ driverId: driverId || undefined, conductorId: conductorId || undefined })} disabled={loading} style={{ padding: '8px 18px', borderRadius: 7, background: T.teal, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Assign Crew'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Assign Route Modal ────────────────────────────────────────────────────────
function AssignRouteModal({ vehicle, routes, onClose, onSubmit, loading }: {
  vehicle: VehicleResponse;
  routes: RouteSummaryResponse[];
  onClose: () => void;
  onSubmit: (routeId: string | null) => void;
  loading: boolean;
}) {
  const [routeId, setRouteId] = useState(vehicle.routeId ?? '');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420 }}>
        <MHead title={`Assign Route — ${vehicle.registrationPlate}`} onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          {vehicle.routeName && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: '#06b6d4', marginBottom: 4 }}>Current Route</div>
              <div style={{ fontSize: 12, color: T.text }}><strong>[{vehicle.routeCode}]</strong> {vehicle.routeName}</div>
            </div>
          )}
          <label style={lbl}>Select Route</label>
          <select style={inp} value={routeId} onChange={e => setRouteId(e.target.value)}>
            <option value="">— Unassign route —</option>
            {routes.map((r: RouteSummaryResponse) => (
              <option key={r.id} value={r.id}>[{r.routeCode}] {r.origin} → {r.destination}</option>
            ))}
          </select>
          {routes.length === 0 && <p style={{ fontSize: 11, color: T.muted, fontFamily: 'IBM Plex Mono', marginTop: 8 }}>No active routes available. Ask your system admin to create routes.</p>}
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button onClick={() => onSubmit(routeId || null)} disabled={loading} style={{ padding: '8px 18px', borderRadius: 7, background: '#06b6d4', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Assign Route'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Status Modal ──────────────────────────────────────────────────────────────
function StatusModal({ vehicle, onClose, onSubmit, loading }: {
  vehicle: VehicleResponse;
  onClose: () => void;
  onSubmit: (status: string, notes?: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(vehicle.status);
  const [notes, setNotes]   = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 380 }}>
        <MHead title={`Update Status — ${vehicle.registrationPlate}`} onClose={onClose} />
        <div style={{ padding: '18px 22px', display: 'grid', gap: 14 }}>
          <div>
            <label style={lbl}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${status === s ? STATUS_COLORS[s] : T.border}`,
                  background: status === s ? `${STATUS_COLORS[s]}15` : 'transparent',
                  color: status === s ? STATUS_COLORS[s] : T.muted,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'IBM Plex Sans',
                  fontWeight: status === s ? 600 : 400, transition: 'all 0.15s',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Notes (optional)</label>
            <input style={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for status change..." />
          </div>
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button onClick={() => onSubmit(status, notes)} disabled={loading} style={{ padding: '8px 18px', borderRadius: 7, background: STATUS_COLORS[status], border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── View Vehicle Modal ────────────────────────────────────────────────────────
function ViewVehicleModal({ vehicle, onClose }: { vehicle: VehicleResponse; onClose: () => void }) {
  const fields = [
    { label: 'Registration', value: vehicle.registrationPlate },
    { label: 'Make / Model',  value: `${vehicle.make} ${vehicle.model}` },
    { label: 'Year',          value: String(vehicle.year) },
    { label: 'Capacity',      value: `${vehicle.capacity} passengers` },
    { label: 'Color',         value: vehicle.color || '—' },
    { label: 'Status',        value: vehicle.status },
    { label: 'Route',         value: vehicle.routeName ? `[${vehicle.routeCode}] ${vehicle.routeName}` : 'Not assigned' },
    { label: 'Driver',        value: vehicle.driverName ?? 'Not assigned' },
    { label: 'Conductor',     value: vehicle.conductorName ?? 'Not assigned' },
    { label: 'Last Service',  value: vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString('en-KE') : '—' },
    { label: 'Next Service',  value: vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString('en-KE') : '—' },
    { label: 'Mileage',       value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—' },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 480 }}>
        <MHead title={`${vehicle.registrationPlate} — ${vehicle.make} ${vehicle.model}`} onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          {vehicle.maintenanceDue && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 14, fontSize: 11, color: T.warning, fontFamily: 'IBM Plex Mono' }}>
              ⚠ Maintenance due — schedule service soon
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <div key={f.label} style={{ padding: '9px 11px', background: '#0a1628', borderRadius: 7, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.8px', color: T.muted, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 11.5, color: T.text }}>{f.value}</div>
              </div>
            ))}
          </div>
          {vehicle.notes && (
            <div style={{ marginTop: 10, padding: '9px 11px', background: '#0a1628', borderRadius: 7, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>Notes</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{vehicle.notes}</div>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, textAlign: 'right' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Close</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
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
function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? '#64748b';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.5px', background: `${c}15`, color: c, border: `1px solid ${c}30` }}>{status}</span>
  );
}
function QuickAssign({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.teal, background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.25)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>
      {label}
    </button>
  );
}
function ABtn({ icon, title, onClick, danger }: { icon: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick} style={{ padding: '4px 6px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, opacity: 0.6, transition: 'opacity 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; if (danger) e.currentTarget.style.borderColor = T.danger; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = T.border; }}
    >{icon}</button>
  );
}
function Pag({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>{label}</button>;
}