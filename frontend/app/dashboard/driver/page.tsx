/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { driverApi } from '@/lib/api/driver';
import { AuthService } from '@/lib/utils/auth';
import type { DriverTripContextResponse, TripResponse, TripSummaryResponse } from '@/types/api';

const G = {
  bg:      '#0a1209',
  surface: '#0d1a0d',
  card:    '#111f11',
  border:  '#1a3320',
  green:   '#22c55e',
  lime:    '#84cc16',
  text:    '#e8f5e9',
  muted:   '#4d7a52',
  danger:  '#ef4444',
  warning: '#f59e0b',
  amber:   '#f97316',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0a1209', border: '1px solid #1a3320',
  borderRadius: 8, color: '#e8f5e9',
  fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none',
};

export default function DriverDashboardPage() {
  const qc   = useQueryClient();
  const user = AuthService.getUser();
  const [elapsed, setElapsed]   = useState('00:00:00');
  const [modal, setModal]       = useState<'start' | 'end' | 'cancel' | null>(null);

  // Context query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['driver-context'],
    queryFn:  () => driverApi.getMyContext(),
    refetchInterval: 30000,
  });
  const ctx: DriverTripContextResponse | null = data?.data?.data ?? null;

  // Trip history
  const { data: histData } = useQuery({
    queryKey: ['driver-trips-history'],
    queryFn:  () => driverApi.getMyTrips({ page: 1, pageSize: 8 }),
  });
  const history: TripSummaryResponse[] = histData?.data?.data ?? [];

  // Live timer
  useEffect(() => {
    if (!ctx?.activeTrip?.actualStartTime) { setElapsed('00:00:00'); return; }
    const start = new Date(ctx.activeTrip.actualStartTime).getTime();
    const tick = () => {
      const d = Date.now() - start;
      const h = Math.floor(d / 3600000).toString().padStart(2, '0');
      const m = Math.floor((d % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((d % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ctx?.activeTrip?.actualStartTime]);

  // Mutations
  const startMut = useMutation({
    mutationFn: (req: { vehicleId: string; routeId: string; initialPassengerCount: number; notes: string }) =>
      driverApi.startTrip({ vehicleId: req.vehicleId, routeId: req.routeId, initialPassengerCount: req.initialPassengerCount || undefined, notes: req.notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      qc.invalidateQueries({ queryKey: ['driver-trips-history'] });
      setModal(null);
      toast.success('Trip started. Drive safe! 🚌');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to start trip.'),
  });

  const endMut = useMutation({
    mutationFn: ({ tripId, count, notes }: { tripId: string; count: number; notes: string }) =>
      driverApi.endTrip(tripId, { finalPassengerCount: count, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      qc.invalidateQueries({ queryKey: ['driver-trips-history'] });
      setModal(null);
      toast.success('Trip completed! Well done. ✅');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to end trip.'),
  });

  const cancelMut = useMutation({
    mutationFn: ({ tripId, reason }: { tripId: string; reason: string }) =>
      driverApi.cancelTrip(tripId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      setModal(null);
      toast.success('Trip cancelled.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to cancel.'),
  });

  const trip = ctx?.activeTrip;

  return (
    <div style={{ padding: '24px', fontFamily: 'Barlow, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        input:focus, textarea:focus { border-color: #22c55e !important; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)} 60%{box-shadow:0 0 0 10px rgba(34,197,94,0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: G.text, letterSpacing: '-.3px' }}>
          Good {getGreeting()}, {user?.firstName}
        </h1>
        <p style={{ fontSize: 12, color: G.muted, marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
          {user?.employeeId} · {user?.saccoName ?? 'QuickTransit'}
        </p>
      </div>

      {isLoading ? <Skeleton /> : (
        <>
          {/* ── ACTIVE TRIP ─────────────────────────────────────────────── */}
          {trip ? (
            <ActiveTripCard
              trip={trip}
              elapsed={elapsed}
              onEnd={() => setModal('end')}
              onCancel={() => setModal('cancel')}
            />
          ) : (
            <NoTripCard ctx={ctx} onStart={() => setModal('start')} />
          )}

          {/* ── Quick stats ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: "Today's Trips",  value: history.filter(t => isToday(t.actualStartTime)).length, color: G.green },
              { label: 'Total Trips',    value: histData?.data?.totalCount ?? 0,                        color: G.lime },
              { label: 'Avg Passengers', value: avgPax(history),                                        color: G.amber },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: G.card, border: `1px solid ${G.border}`,
                borderRadius: 10, padding: '12px 14px',
                animation: `fadeUp .3s ease ${i*60}ms both`,
              }}>
                <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: G.muted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Trip history ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1.5px', color: G.muted, marginBottom: 10 }}>
              Recent Trips
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.length === 0 ? (
                <EmptyState message="No trips recorded yet" />
              ) : history.map(t => <HistoryRow key={t.id} trip={t} />)}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {modal === 'start' && ctx && (
        <StartModal ctx={ctx} onClose={() => setModal(null)}
          onSubmit={req => startMut.mutate(req)} loading={startMut.isPending} />
      )}
      {modal === 'end' && trip && (
        <EndModal trip={trip} elapsed={elapsed} onClose={() => setModal(null)}
          onSubmit={d => endMut.mutate({ tripId: trip.id, ...d })} loading={endMut.isPending} />
      )}
      {modal === 'cancel' && trip && (
        <CancelModal trip={trip} onClose={() => setModal(null)}
          onConfirm={reason => cancelMut.mutate({ tripId: trip.id, reason })} loading={cancelMut.isPending} />
      )}
    </div>
  );
}

// ── Active Trip Card ──────────────────────────────────────────────────────────
function ActiveTripCard({ trip, elapsed, onEnd, onCancel }: {
  trip: TripResponse; elapsed: string; onEnd: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      background: G.card, border: `2px solid ${G.green}`,
      borderRadius: 14, overflow: 'hidden',
      animation: 'glow 3s ease infinite, fadeUp .3s ease',
    }}>
      {/* Status bar */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #166534)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: G.lime, animation: 'blink 1.5s infinite' }} />
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>
            In Progress
          </span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: G.lime, letterSpacing: '2px' }}>
          {elapsed}
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: G.lime, background: 'rgba(132,204,22,.12)', padding: '2px 8px', borderRadius: 5 }}>
            {trip.routeCode}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{trip.routeName}</span>
        </div>

        {/* Path bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}`, marginBottom: 14 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: G.green }} />
          <span style={{ fontSize: 11, color: G.text }}>{trip.origin}</span>
          <div style={{ flex: 1, height: 1, background: G.border }} />
          <span style={{ fontSize: 11, color: G.text }}>{trip.destination}</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: G.danger }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatMini label="Vehicle"    value={trip.registrationPlate} mono />
          <StatMini label="Init. Pax"  value={String(trip.initialPassengerCount ?? 0)} accent={G.lime} />
          <StatMini label="Peak Pax"   value={String(trip.peakPassengerCount ?? 0)} accent={G.warning} />
        </div>

        {/* Conductor info */}
        {trip.conductorName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}`, marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: G.muted, textTransform: 'uppercase' }}>Conductor</span>
            <span style={{ fontSize: 12, color: G.text, fontWeight: 500 }}>{trip.conductorName}</span>
          </div>
        )}

        {/* Recent passenger logs */}
        {trip.passengerLogs.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: G.muted, marginBottom: 6 }}>
              Passenger Logs ({trip.passengerLogs.length})
            </div>
            <div style={{ maxHeight: 100, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...trip.passengerLogs].reverse().slice(0, 4).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 9px', background: '#0a1209', borderRadius: 5, border: `1px solid ${G.border}` }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: G.muted }}>
                      {new Date(log.logTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {log.stopName && <span style={{ fontSize: 10, color: G.muted }}>{log.stopName}</span>}
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: G.lime }}>{log.passengerCount} pax</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <button onClick={onEnd} style={{
            padding: '13px', borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Barlow, sans-serif', letterSpacing: '.3px',
          }}>✓ End Trip</button>
          <button onClick={onCancel} style={{
            padding: '13px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.3)',
            color: G.danger, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Barlow, sans-serif',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── No Trip Card ──────────────────────────────────────────────────────────────
function NoTripCard({ ctx, onStart }: { ctx: DriverTripContextResponse | null; onStart: () => void }) {
  const hasVehicle = !!ctx?.assignedVehiclePlate;
  const hasRoute   = !!ctx?.assignedRouteId;
  const canStart   = ctx?.canStartTrip ?? false;

  return (
    <div style={{
      background: G.card, border: `1px solid ${G.border}`,
      borderRadius: 14, overflow: 'hidden',
      animation: 'fadeUp .3s ease',
    }}>
      {/* Top banner */}
      <div style={{ background: 'rgba(34,197,94,.04)', borderBottom: `1px solid ${G.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: G.muted }} />
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: G.muted, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          No Active Trip
        </span>
      </div>

      <div style={{ padding: '18px' }}>
        {/* Assignment */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: G.muted, marginBottom: 10 }}>Your Assignment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', background: '#0a1209', borderRadius: 8, border: `1px solid ${hasVehicle ? 'rgba(132,204,22,.3)' : G.border}` }}>
              <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 3 }}>Vehicle</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: hasVehicle ? G.lime : G.muted }}>
                {ctx?.assignedVehiclePlate ?? '—'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: '#0a1209', borderRadius: 8, border: `1px solid ${hasRoute ? 'rgba(34,197,94,.3)' : G.border}` }}>
              <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 3 }}>Route</div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: hasRoute ? G.green : G.muted }}>
                {hasRoute ? `[${ctx?.assignedRouteCode}] ${ctx?.assignedRouteName}` : 'Not assigned'}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {!hasVehicle && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', fontSize: 11, color: G.warning, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚠ No vehicle assigned — contact your SACCO manager
            </div>
          )}
          {hasVehicle && !hasRoute && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', fontSize: 11, color: G.warning, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚠ No route assigned to your vehicle — contact your manager
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
            background: canStart ? 'linear-gradient(135deg, #22c55e, #16a34a)' : G.border,
            color: canStart ? '#fff' : G.muted,
            fontSize: 15, fontWeight: 700, cursor: canStart ? 'pointer' : 'not-allowed',
            fontFamily: 'Barlow, sans-serif', letterSpacing: '.3px',
            transition: 'opacity .15s',
          }}
        >
          {canStart ? '▶  Start New Trip' : 'Cannot Start Trip'}
        </button>
      </div>
    </div>
  );
}

// ── Start Modal ───────────────────────────────────────────────────────────────
function StartModal({ ctx, onClose, onSubmit, loading }: {
  ctx: DriverTripContextResponse;
  onClose: () => void;
  onSubmit: (r: { vehicleId: string; routeId: string; initialPassengerCount: number; notes: string }) => void;
  loading: boolean;
}) {
  const [pax, setPax]     = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Overlay onClose={onClose}>
      <ModalHead title="Start Trip" onClose={onClose} />
      <div style={{ padding: '16px 18px' }}>
        {/* Summary */}
        <div style={{ padding: '12px', background: '#0a1209', borderRadius: 9, border: `1px solid ${G.border}`, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>Vehicle</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: G.lime }}>{ctx.assignedVehiclePlate}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>Route</div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: G.green }}>[{ctx.assignedRouteCode}] {ctx.assignedRouteName}</div>
          </div>
        </div>
        <FieldGroup label="Initial Passengers">
          <input type="number" min="0" max="100" style={inp} value={pax} onChange={e => setPax(e.target.value)} placeholder="0" />
        </FieldGroup>
        <FieldGroup label="Notes (optional)">
          <textarea style={{ ...inp, height: 56, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any departure notes..." />
        </FieldGroup>
      </div>
      <ModalFoot onClose={onClose} loading={loading} label="▶ Start Trip" color="#22c55e" textColor="#000"
        onSubmit={() => onSubmit({ vehicleId: ctx.assignedVehicleId!, routeId: ctx.assignedRouteId!, initialPassengerCount: parseInt(pax) || 0, notes })} />
    </Overlay>
  );
}

// ── End Modal ─────────────────────────────────────────────────────────────────
function EndModal({ trip, elapsed, onClose, onSubmit, loading }: {
  trip: TripResponse; elapsed: string; onClose: () => void;
  onSubmit: (d: { count: number; notes: string }) => void; loading: boolean;
}) {
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Overlay onClose={onClose}>
      <ModalHead title="End Trip" onClose={onClose} />
      <div style={{ padding: '16px 18px' }}>
        {/* Summary strip */}
        <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,.06)', borderRadius: 9, border: '1px solid rgba(34,197,94,.2)', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div><div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>Duration</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: G.lime }}>{elapsed}</div></div>
          <div><div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>Route</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: G.green }}>{trip.routeCode}</div></div>
          <div><div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>Peak Pax</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: G.warning }}>{trip.peakPassengerCount ?? 0}</div></div>
        </div>
        <FieldGroup label="Final Passenger Count *">
          <input type="number" min="0" max="100" required style={inp} value={count} onChange={e => setCount(e.target.value)} placeholder="Passengers at journey end" />
        </FieldGroup>
        <FieldGroup label="Notes (optional)">
          <textarea style={{ ...inp, height: 56, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Incidents, delays..." />
        </FieldGroup>
      </div>
      <ModalFoot onClose={onClose} loading={loading} label="✓ Complete Trip" color="#22c55e" textColor="#000" disabled={!count}
        onSubmit={() => onSubmit({ count: parseInt(count) || 0, notes })} />
    </Overlay>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ trip, onClose, onConfirm, loading }: {
  trip: TripResponse; onClose: () => void; onConfirm: (r: string) => void; loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <Overlay onClose={onClose}>
      <ModalHead title="Cancel Trip?" onClose={onClose} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', marginBottom: 14, fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
          This will cancel your trip on <strong>[{trip.routeCode}]</strong>. A reason is required.
        </div>
        <FieldGroup label="Reason *">
          <textarea style={{ ...inp, height: 72, resize: 'none' }} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Vehicle breakdown, road closure, medical emergency..." />
        </FieldGroup>
      </div>
      <ModalFoot onClose={onClose} loading={loading} label="Cancel Trip" color="#ef4444" textColor="#fff" disabled={!reason.trim()}
        onSubmit={() => onConfirm(reason)} />
    </Overlay>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HistoryRow({ trip }: { trip: TripSummaryResponse }) {
  const sc: Record<string, string> = { Completed: '#22c55e', InProgress: '#84cc16', Cancelled: '#ef4444', Scheduled: '#f59e0b' };
  const c = sc[trip.status] ?? '#64748b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: G.card, borderRadius: 8, border: `1px solid ${G.border}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: G.lime }}>{trip.routeCode}</span>
            <span style={{ fontSize: 11, color: G.text }}>{trip.routeName}</span>
          </div>
          <div style={{ fontSize: 10, color: G.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
            {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            {trip.durationMinutes ? ` · ${Math.round(trip.durationMinutes)} min` : ''}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: c, background: `${c}15`, padding: '1px 6px', borderRadius: 4 }}>{trip.status}</div>
        {trip.finalPassengerCount != null && (
          <div style={{ fontSize: 9, color: G.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{trip.finalPassengerCount} pax</div>
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div style={{ padding: '8px 10px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}` }}>
      <div style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: G.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono ? 'JetBrains Mono, monospace' : 'Barlow, sans-serif', color: accent ?? G.text }}>{value}</div>
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, overflow: 'hidden', width: 380, maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .17s ease' }}>
        {children}
      </div>
    </div>
  );
}
function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: G.text }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: G.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
    </div>
  );
}
function ModalFoot({ onClose, loading, label, color, textColor, disabled, onSubmit }: { onClose: () => void; loading: boolean; label: string; color: string; textColor: string; disabled?: boolean; onSubmit: () => void }) {
  return (
    <div style={{ padding: '10px 18px 16px', borderTop: `1px solid ${G.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 14px', cursor: 'pointer', color: G.muted }}>Back</button>
      <button onClick={onSubmit} disabled={loading || disabled} style={{ padding: '9px 18px', borderRadius: 8, background: color, border: 'none', color: textColor, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: loading || disabled ? .5 : 1 }}>
        {loading ? 'Please wait...' : label}
      </button>
    </div>
  );
}
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: G.muted, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
function EmptyState({ message }: { message: string }) {
  return <div style={{ padding: '24px', textAlign: 'center', background: G.card, borderRadius: 9, border: `1px solid ${G.border}`, fontSize: 12, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>{message}</div>;
}
function Skeleton() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[140, 80, 60].map((h, i) => <div key={i} style={{ height: h, borderRadius: 12, background: G.card, border: `1px solid ${G.border}`, animation: 'pulse 1.5s infinite' }} />)}</div>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function avgPax(trips: TripSummaryResponse[]) {
  const with_pax = trips.filter(t => t.finalPassengerCount != null);
  if (!with_pax.length) return 0;
  return Math.round(with_pax.reduce((s, t) => s + (t.finalPassengerCount ?? 0), 0) / with_pax.length);
}