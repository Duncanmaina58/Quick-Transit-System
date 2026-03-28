/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { managerApi } from '@/lib/api/manager';
import { adminApi } from '@/lib/api/admin';
import { AuthService } from '@/lib/utils/auth';
import type {
  RouteResponse,
  RouteFilterRequest,
  VehicleSummaryResponse,
} from '@/types/api';

// ── Design tokens (manager: navy + teal) ─────────────────────────────────────
const T = {
  bg:      '#0d1b2a',
  surface: '#0a1628',
  card:    '#0f2033',
  border:  '#1e3a5f',
  teal:    '#0891b2',
  text:    '#e2eaf3',
  muted:   '#5b7fa0',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  cyan:    '#06b6d4',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  background: '#0a1628', border: '1px solid #1e3a5f',
  borderRadius: 7, color: '#e2eaf3',
  fontSize: 12.5, fontFamily: 'IBM Plex Sans, sans-serif', outline: 'none',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontFamily: 'IBM Plex Mono',
  textTransform: 'uppercase', letterSpacing: '.8px', color: '#5b7fa0', marginBottom: 5,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManagerRoutesPage() {
  const qc      = useQueryClient();
  const saccoId = AuthService.getSaccoId();

  const [filter, setFilter]         = useState<RouteFilterRequest>({ page: 1, pageSize: 20, isActive: true });
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected]     = useState<RouteResponse | null>(null);
  const [assignModal, setAssignModal] = useState<RouteResponse | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['manager-routes', filter],
    queryFn:  () => managerApi.getRoutes(filter),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicle-summaries', saccoId],
    queryFn:  () => saccoId ? adminApi.getVehicleSummaries(saccoId) : Promise.resolve(null),
    enabled:  !!saccoId,
  });

  const routes   = data?.data?.data  ?? [];
  const meta     = data?.data;
  const vehicles: VehicleSummaryResponse[] = vehiclesData?.data?.data ?? [];

  // ── Assign route mutation ─────────────────────────────────────────────────
  const assignMut = useMutation({
    mutationFn: ({ vehicleId, routeId }: { vehicleId: string; routeId: string }) =>
      managerApi.assignRoute(vehicleId, { routeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicle-summaries'] });
      setAssignModal(null);
      toast.success('Route assigned to vehicle.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to assign route.'),
  });

  const handleFilter = useCallback((k: keyof RouteFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  const toggleInactive = () => {
    const next = !showInactive;
    setShowInactive(next);
    setFilter(f => ({ ...f, isActive: next ? undefined : true, page: 1 }));
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        input:focus, select:focus { border-color: #0891b2 !important; }
        .rcard:hover { border-color: #0891b2 !important; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96) translateY(6px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-.3px' }}>Routes</h1>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            System routes · assign them to your vehicles · routes are created by the system admin
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={toggleInactive}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: showInactive ? 'rgba(8,145,178,.15)' : 'transparent',
              border: `1px solid ${showInactive ? T.teal : T.border}`,
              color: showInactive ? T.teal : T.muted,
              fontSize: 11, fontFamily: 'IBM Plex Mono', cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {showInactive ? '● All routes' : '○ Show inactive'}
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Available Routes', value: meta?.totalCount ?? '—', color: T.teal },
          { label: 'Your Vehicles',    value: vehicles.length,           color: '#8b5cf6' },
          { label: 'Assigned',         value: vehicles.filter(v => v.hasDriver).length, color: T.success },
        ].map((s, i) => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            animation: `fadeUp .3s ease ${i * 60}ms both`,
          }}>
            <div style={{ height: 2, background: s.color, position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '10px 10px 0 0' }} />
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'IBM Plex Mono', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <input
          placeholder="Search routes by name, code, origin or destination..."
          value={filter.search ?? ''}
          onChange={e => handleFilter('search', e.target.value)}
          style={{ ...inp, maxWidth: 420 }}
        />
      </div>

      {/* ── Two-panel layout ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 18, alignItems: 'start' }}>

        {/* Route cards grid */}
        <div>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 160, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📍</div>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 6 }}>No routes found</div>
              <div style={{ fontSize: 12, color: T.muted }}>Contact your system admin to create routes.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {routes.map((r: RouteResponse, i: number) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  selected={selected?.id === r.id}
                  delay={i * 40}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  onAssign={() => setAssignModal(r)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>
                Page {meta.page} / {meta.totalPages} · {meta.totalCount} routes
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pag label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
                <Pag label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
              </div>
            </div>
          )}
        </div>

        {/* Detail panel (slides in when route selected) */}
        {selected && (
          <RouteDetailPanel
            route={selected}
            vehicles={vehicles}
            onAssign={() => setAssignModal(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* ── Assign modal ──────────────────────────────────────────────── */}
      {assignModal && (
        <AssignVehicleModal
          route={assignModal}
          vehicles={vehicles}
          onClose={() => setAssignModal(null)}
          onAssign={(vehicleId) => assignMut.mutate({ vehicleId, routeId: assignModal.id })}
          loading={assignMut.isPending}
        />
      )}
    </div>
  );
}

// ── Route Card ────────────────────────────────────────────────────────────────
function RouteCard({ route, selected, delay, onClick, onAssign }: {
  route: RouteResponse;
  selected: boolean;
  delay: number;
  onClick: () => void;
  onAssign: () => void;
}) {
  const stops = parseStops(route.stops);

  return (
    <div
      className="rcard"
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${selected ? T.teal : T.border}`,
        borderRadius: 12, padding: '16px',
        cursor: 'pointer', transition: 'border-color .15s',
        animation: `fadeUp .3s ease ${delay}ms both`,
        position: 'relative',
      }}
    >
      {/* Active indicator */}
      {!route.isActive && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase',
          color: '#ef4444', background: 'rgba(239,68,68,.1)',
          padding: '1px 6px', borderRadius: 4,
        }}>Inactive</div>
      )}

      {/* Code + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(8,145,178,.12)',
          fontSize: 11, fontFamily: 'IBM Plex Mono', fontWeight: 600, color: T.teal,
          flexShrink: 0,
        }}>
          {route.routeCode}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{route.name}</div>
        </div>
      </div>

      {/* Route path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.success, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.text }}>{route.origin}</span>
        <div style={{ flex: 1, height: 1, background: T.border, margin: '0 4px' }} />
        <span style={{ fontSize: 11, color: T.text }}>{route.destination}</span>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.danger, flexShrink: 0 }} />
      </div>

      {/* Stops chips */}
      {stops.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {stops.slice(0, 3).map(s => (
            <span key={s} style={{
              fontSize: 9, fontFamily: 'IBM Plex Mono',
              padding: '1px 6px', borderRadius: 4,
              background: 'rgba(91,127,160,.15)', color: T.muted,
            }}>{s}</span>
          ))}
          {stops.length > 3 && (
            <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted }}>
              +{stops.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {route.distanceKm && (
            <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>
              {route.distanceKm} km
            </span>
          )}
          {route.estimatedMinutes && (
            <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>
              ~{route.estimatedMinutes} min
            </span>
          )}
          <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.cyan }}>
            {route.totalVehicles} vehicle{route.totalVehicles !== 1 ? 's' : ''}
          </span>
        </div>

        {route.isActive && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(); }}
            style={{
              fontSize: 10, fontFamily: 'IBM Plex Mono',
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(8,145,178,.12)',
              border: '1px solid rgba(8,145,178,.3)',
              color: T.teal, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(8,145,178,.12)')}
          >
            Assign to vehicle →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Route Detail Panel ────────────────────────────────────────────────────────
function RouteDetailPanel({ route, vehicles, onAssign, onClose }: {
  route: RouteResponse;
  vehicles: VehicleSummaryResponse[];
  onAssign: () => void;
  onClose: () => void;
}) {
  const stops = parseStops(route.stops);

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.teal}40`,
      borderRadius: 12, overflow: 'hidden',
      animation: 'slideIn .2s ease',
      position: 'sticky', top: 28,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600, color: T.teal, background: 'rgba(8,145,178,.12)', padding: '2px 8px', borderRadius: 5 }}>
            {route.routeCode}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{route.name}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Route path with stops */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 10 }}>Route Path</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.success, border: '2px solid rgba(16,185,129,.3)', flexShrink: 0 }} />
              <div style={{ width: 2, background: T.border, flex: 1, margin: '4px 0', minHeight: stops.length > 0 ? 24 : 16 }} />
              {stops.map((_, i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.muted, flexShrink: 0 }} />
                  {i < stops.length - 1 && <div style={{ width: 2, background: T.border, height: 20, margin: '4px 0' }} />}
                </div>
              ))}
              {stops.length > 0 && <div style={{ width: 2, background: T.border, height: 20, margin: '4px 0' }} />}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.danger, border: '2px solid rgba(239,68,68,.3)', flexShrink: 0 }} />
            </div>
            {/* Labels */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, paddingBottom: 6 }}>{route.origin}</div>
              {stops.map((stop, i) => (
                <div key={i} style={{ fontSize: 11, color: T.muted, fontFamily: 'IBM Plex Mono', padding: '4px 0' }}>{stop}</div>
              ))}
              {stops.length > 0 && <div style={{ paddingTop: 4 }} />}
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{route.destination}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Distance',     value: route.distanceKm ? `${route.distanceKm} km` : '—' },
            { label: 'Est. Time',    value: route.estimatedMinutes ? `${route.estimatedMinutes} min` : '—' },
            { label: 'Stops',        value: String(stops.length) },
            { label: 'Vehicles',     value: String(route.totalVehicles) },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: T.text }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Your vehicles without this route */}
        {vehicles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 8 }}>
              Your fleet ({vehicles.length} vehicles)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {vehicles.map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: T.teal, fontWeight: 600 }}>{v.registrationPlate}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{v.makeModel}</div>
                  </div>
                  <StatusChip status={v.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign CTA */}
        {route.isActive && (
          <button
            onClick={onAssign}
            style={{
              width: '100%', padding: '10px',
              borderRadius: 8, background: T.teal, border: 'none',
              color: '#fff', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif',
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0e7490')}
            onMouseLeave={e => (e.currentTarget.style.background = T.teal)}
          >
            Assign this route to a vehicle →
          </button>
        )}

        {route.description && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>Description</div>
            <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{route.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assign Vehicle Modal ──────────────────────────────────────────────────────
function AssignVehicleModal({ route, vehicles, onClose, onAssign, loading }: {
  route: RouteResponse;
  vehicles: VehicleSummaryResponse[];
  onClose: () => void;
  onAssign: (vehicleId: string) => void;
  loading: boolean;
}) {
  const [vehicleId, setVehicleId] = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 440 }}>
        <MHead title="Assign Route to Vehicle" onClose={onClose} />
        <div style={{ padding: '18px 22px' }}>
          {/* Route summary */}
          <div style={{
            padding: '12px 14px', borderRadius: 9,
            background: 'rgba(8,145,178,.06)', border: '1px solid rgba(8,145,178,.2)',
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.teal, marginBottom: 6 }}>Assigning Route</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600, color: T.teal, background: 'rgba(8,145,178,.15)', padding: '1px 7px', borderRadius: 4 }}>
                {route.routeCode}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{route.name}</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
              {route.origin} → {route.destination}
              {route.distanceKm && ` · ${route.distanceKm} km`}
              {route.estimatedMinutes && ` · ~${route.estimatedMinutes} min`}
            </div>
          </div>

          <label style={lbl}>Select Vehicle *</label>
          <select
            style={{ ...inp, marginBottom: 12 }}
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.length === 0 ? (
              <option disabled>No vehicles registered in your SACCO</option>
            ) : (
              vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registrationPlate} — {v.makeModel} ({v.status})
                </option>
              ))
            )}
          </select>

          {vehicleId && (
            <div style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontFamily: 'IBM Plex Mono' }}>
              ℹ This will replace any existing route assignment on the selected vehicle.
            </div>
          )}
        </div>
        <div style={{ padding: '10px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button
            onClick={() => vehicleId && onAssign(vehicleId)}
            disabled={!vehicleId || loading}
            style={{
              padding: '8px 18px', borderRadius: 7, background: T.teal, border: 'none',
              color: '#fff', fontSize: 12.5, fontWeight: 600,
              cursor: vehicleId ? 'pointer' : 'not-allowed',
              opacity: !vehicleId || loading ? .5 : 1,
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            {loading ? 'Assigning...' : 'Assign Route'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseStops(stops?: string): string[] {
  if (!stops) return [];
  try { return JSON.parse(stops) as string[]; }
  catch { return stops.split(',').map(s => s.trim()).filter(Boolean); }
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:      '#10b981',
    Maintenance: '#f59e0b',
    Inactive:    '#ef4444',
    Suspended:   '#64748b',
  };
  const c = map[status] ?? '#64748b';
  return (
    <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 4, background: `${c}18`, color: c }}>
      {status}
    </span>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .17s ease' }}>
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

function Pag({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1 }}>
      {label}
    </button>
  );
}