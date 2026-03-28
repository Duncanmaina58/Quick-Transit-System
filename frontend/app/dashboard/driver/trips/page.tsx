/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { driverApi } from '@/lib/api/driver';
import { AuthService } from '@/lib/utils/auth';
import type { DriverTripContextResponse, TripResponse, TripSummaryResponse } from '@/types/api';

// ── Design: deep forest green + electric lime — operational, urgent ────────
const T = {
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

export default function DriverDashboard() {
  const qc   = useQueryClient();
  const user = AuthService.getUser();
  const [now, setNow] = useState('');
  const [showEndModal, setShowEndModal]       = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStartModal, setShowStartModal]   = useState(false);
  const [elapsed, setElapsed]                 = useState('00:00:00');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['driver-context'],
    queryFn:  () => driverApi.getMyContext(),
    refetchInterval: 30000,
  });

  const ctx: DriverTripContextResponse | null = data?.data?.data ?? null;

  // Live trip timer
  useEffect(() => {
    if (!ctx?.activeTrip?.actualStartTime) return;
    const start = new Date(ctx.activeTrip.actualStartTime).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ctx?.activeTrip?.actualStartTime]);

  const { data: historyData } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => driverApi.getMyTrips({ page: 1, pageSize: 10 }),
  });
  const history = historyData?.data?.data ?? [];

  const endMut = useMutation({
    mutationFn: ({ tripId, count, notes }: { tripId: string; count: number; notes: string }) =>
      driverApi.endTrip(tripId, { finalPassengerCount: count, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      qc.invalidateQueries({ queryKey: ['driver-trips'] });
      setShowEndModal(false);
      toast.success('Trip completed! Great work.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to end trip.'),
  });

  const cancelMut = useMutation({
    mutationFn: ({ tripId, reason }: { tripId: string; reason: string }) =>
      driverApi.cancelTrip(tripId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      setShowCancelModal(false);
      toast.success('Trip cancelled.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to cancel.'),
  });

  const startMut = useMutation({
    mutationFn: (req: { vehicleId: string; routeId: string; initialPassengerCount: number; notes: string }) =>
      driverApi.startTrip({
        vehicleId: req.vehicleId,
        routeId: req.routeId,
        initialPassengerCount: req.initialPassengerCount || undefined,
        notes: req.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-context'] });
      qc.invalidateQueries({ queryKey: ['driver-trips'] });
      setShowStartModal(false);
      toast.success('Trip started. Drive safe!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to start trip.'),
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '28px 28px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a1209; color: #e8f5e9; }
        input:focus, select:focus, textarea:focus { border-color: #22c55e !important; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.3)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-.3px' }}>
                {user?.firstName} {user?.lastName}
              </h1>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: T.green, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user?.employeeId} · Driver
              </div>
            </div>
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: T.green, fontWeight: 700, letterSpacing: '2px' }}>
          {now}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : ctx?.hasActiveTrip && ctx.activeTrip ? (
        /* ── ACTIVE TRIP VIEW ─────────────────────────────────────────── */
        <ActiveTripView
          trip={ctx.activeTrip}
          elapsed={elapsed}
          onEnd={() => setShowEndModal(true)}
          onCancel={() => setShowCancelModal(true)}
        />
      ) : (
        /* ── NO ACTIVE TRIP ───────────────────────────────────────────── */
        <NoTripView
          ctx={ctx}
          onStart={() => setShowStartModal(true)}
        />
      )}

      {/* ── Trip History ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1.5px', color: T.muted, marginBottom: 14 }}>
          Recent Trips
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12, color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>
              No trips recorded yet
            </div>
          ) : history.map((t: TripSummaryResponse) => (
            <TripHistoryRow key={t.id} trip={t} />
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {showStartModal && ctx && (
        <StartTripModal
          ctx={ctx}
          onClose={() => setShowStartModal(false)}
          onSubmit={(req) => startMut.mutate(req)}
          loading={startMut.isPending}
        />
      )}
      {showEndModal && ctx?.activeTrip && (
        <EndTripModal
          trip={ctx.activeTrip}
          elapsed={elapsed}
          onClose={() => setShowEndModal(false)}
          onSubmit={({ count, notes }) => endMut.mutate({ tripId: ctx.activeTrip!.id, count, notes })}
          loading={endMut.isPending}
        />
      )}
      {showCancelModal && ctx?.activeTrip && (
        <CancelTripModal
          trip={ctx.activeTrip}
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelMut.mutate({ tripId: ctx.activeTrip!.id, reason })}
          loading={cancelMut.isPending}
        />
      )}
    </div>
  );
}

// ── Active Trip View ──────────────────────────────────────────────────────────
function ActiveTripView({ trip, elapsed, onEnd, onCancel }: {
  trip: TripResponse; elapsed: string; onEnd: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ animation: 'slideUp .3s ease' }}>
      {/* Live trip card */}
      <div style={{
        background: T.card, border: `2px solid ${T.green}`,
        borderRadius: 16, overflow: 'hidden',
        animation: 'glow 3s ease infinite',
      }}>
        {/* Status bar */}
        <div style={{
          background: 'linear-gradient(135deg, #166534, #15803d)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.lime, animation: 'blink 1.5s infinite' }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Trip In Progress
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: T.lime, letterSpacing: '2px' }}>
            {elapsed}
          </div>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {/* Route info */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.lime, background: 'rgba(132,204,22,.12)', padding: '2px 10px', borderRadius: 5 }}>
                {trip.routeCode}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{trip.routeName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#0a1209', borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green }} />
              <span style={{ fontSize: 12, color: T.text }}>{trip.origin}</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.text }}>{trip.destination}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.danger }} />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            <StatBox label="Vehicle"    value={trip.registrationPlate} mono />
            <StatBox label="Passengers" value={String(trip.initialPassengerCount ?? 0)} accent={T.lime} />
            <StatBox label="Peak"       value={String(trip.peakPassengerCount ?? 0)} accent={T.warning} />
          </div>

          {/* Conductor */}
          {trip.conductorName && (
            <div style={{ padding: '10px 14px', background: '#0a1209', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: T.muted, textTransform: 'uppercase' }}>Conductor:</span>
              <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{trip.conductorName}</span>
            </div>
          )}

          {/* Recent passenger logs */}
          {trip.passengerLogs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 8 }}>Passenger Log</div>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[...trip.passengerLogs].reverse().slice(0, 5).map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0a1209', borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: T.muted }}>
                        {new Date(log.logTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {log.stopName && <span style={{ fontSize: 11, color: T.muted }}>{log.stopName}</span>}
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.lime }}>
                      {log.passengerCount} pax
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <button onClick={onEnd} style={{
              padding: '14px', borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '.3px',
            }}>
              ✓ End Trip
            </button>
            <button onClick={onCancel} style={{
              padding: '14px 18px', borderRadius: 10,
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.3)',
              color: T.danger, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── No Trip View ──────────────────────────────────────────────────────────────
function NoTripView({ ctx, onStart }: { ctx: DriverTripContextResponse | null; onStart: () => void }) {
  return (
    <div style={{ animation: 'slideUp .3s ease' }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: '28px 24px', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>No Active Trip</h2>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
          You are not currently on a trip. Start a new trip when you are ready to depart.
        </p>

        {/* Assignment info */}
        {ctx?.assignedVehiclePlate ? (
          <div style={{ padding: '14px', background: '#0a1209', borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 10 }}>Your Assignment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <AssignmentItem label="Vehicle" value={ctx.assignedVehiclePlate} accent={T.lime} />
              {ctx.assignedRouteName ? (
                <AssignmentItem label="Route" value={`[${ctx.assignedRouteCode}] ${ctx.assignedRouteName}`} accent={T.green} />
              ) : (
                <AssignmentItem label="Route" value="Not assigned" dim />
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px', background: 'rgba(245,158,11,.06)', borderRadius: 10, border: '1px solid rgba(245,158,11,.2)', marginBottom: 20, textAlign: 'left' }}>
            <p style={{ fontSize: 12, color: T.warning, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚠ You are not assigned to a vehicle. Contact your SACCO manager.
            </p>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={!ctx?.canStartTrip}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 12, border: 'none',
            background: ctx?.canStartTrip
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : '#1a3320',
            color: ctx?.canStartTrip ? '#fff' : T.muted,
            fontSize: 15, fontWeight: 700,
            cursor: ctx?.canStartTrip ? 'pointer' : 'not-allowed',
            fontFamily: 'IBM Plex Sans, sans-serif',
            letterSpacing: '.3px',
          }}
        >
          {ctx?.canStartTrip ? '▶ Start New Trip' : 'Cannot Start Trip'}
        </button>
        {!ctx?.canStartTrip && ctx?.assignedVehiclePlate && !ctx?.assignedRouteId && (
          <p style={{ fontSize: 11, color: T.muted, marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
            Your vehicle has no route assigned
          </p>
        )}
      </div>
    </div>
  );
}

// ── Start Trip Modal ──────────────────────────────────────────────────────────
function StartTripModal({ ctx, onClose, onSubmit, loading }: {
  ctx: DriverTripContextResponse;
  onClose: () => void;
  onSubmit: (req: { vehicleId: string; routeId: string; initialPassengerCount: number; notes: string }) => void;
  loading: boolean;
}) {
  const [passengers, setPassengers] = useState('');
  const [notes, setNotes]           = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Start Trip</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px' }}>
          {/* Assignment summary */}
          <div style={{ padding: '12px 14px', background: '#0a1209', borderRadius: 9, border: `1px solid ${T.border}`, marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>Vehicle</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.lime }}>{ctx.assignedVehiclePlate}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>Route</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.green }}>[{ctx.assignedRouteCode}] {ctx.assignedRouteName}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: T.muted, marginBottom: 6 }}>
              Initial Passengers
            </label>
            <input
              type="number" min="0" max="100"
              style={inp}
              value={passengers}
              onChange={e => setPassengers(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: T.muted, marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              style={{ ...inp, height: 60, resize: 'none' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes for this trip..."
            />
          </div>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Cancel</button>
          <button
            onClick={() => onSubmit({
              vehicleId: ctx.assignedVehicleId!,
              routeId:   ctx.assignedRouteId!,
              initialPassengerCount: parseInt(passengers) || 0,
              notes,
            })}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 8, background: '#22c55e', border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? .6 : 1 }}
          >
            {loading ? 'Starting...' : '▶ Start Trip'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── End Trip Modal ────────────────────────────────────────────────────────────
function EndTripModal({ trip, elapsed, onClose, onSubmit, loading }: {
  trip: TripResponse; elapsed: string;
  onClose: () => void;
  onSubmit: (data: { count: number; notes: string }) => void;
  loading: boolean;
}) {
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>End Trip</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px' }}>
          {/* Trip summary */}
          <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,.06)', borderRadius: 9, border: '1px solid rgba(34,197,94,.2)', marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: T.green, marginBottom: 8 }}>Trip Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 8, color: T.muted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>Duration</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.lime }}>{elapsed}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: T.muted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>Route</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.green }}>{trip.routeCode}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: T.muted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>Peak Pax</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.warning }}>{trip.peakPassengerCount ?? 0}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: T.muted, marginBottom: 6 }}>
              Final Passenger Count *
            </label>
            <input
              type="number" min="0" max="100" required
              style={inp}
              value={count}
              onChange={e => setCount(e.target.value)}
              placeholder="Number of passengers at trip end"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: T.muted, marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              style={{ ...inp, height: 60, resize: 'none' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any incidents or notes..."
            />
          </div>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Back</button>
          <button
            onClick={() => onSubmit({ count: parseInt(count) || 0, notes })}
            disabled={loading || !count}
            style={{ padding: '9px 20px', borderRadius: 8, background: '#22c55e', border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading || !count ? .5 : 1 }}
          >
            {loading ? 'Completing...' : '✓ Complete Trip'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Cancel Trip Modal ─────────────────────────────────────────────────────────
function CancelTripModal({ trip, onClose, onConfirm, loading }: {
  trip: TripResponse; onClose: () => void;
  onConfirm: (reason: string) => void; loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 380 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Cancel Trip?</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
              This will cancel trip on route <strong>[{trip.routeCode}]</strong>. Please provide a reason.
            </p>
          </div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: T.muted, marginBottom: 6 }}>
            Reason *
          </label>
          <textarea
            style={{ ...inp, height: 80, resize: 'none' }}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Vehicle breakdown, road closure..."
          />
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '8px 16px', cursor: 'pointer', color: T.muted }}>Back</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            style={{ padding: '9px 18px', borderRadius: 8, background: '#ef4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading || !reason.trim() ? .5 : 1 }}
          >
            {loading ? 'Cancelling...' : 'Cancel Trip'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Trip History Row ──────────────────────────────────────────────────────────
function TripHistoryRow({ trip }: { trip: TripSummaryResponse }) {
  const statusColors: Record<string, string> = {
    Completed: '#22c55e', InProgress: '#84cc16', Cancelled: '#ef4444', Scheduled: '#f59e0b',
  };
  const c = statusColors[trip.status] ?? '#64748b';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: T.card, borderRadius: 9,
      border: `1px solid ${T.border}`, animation: 'slideUp .25s ease',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: '#84cc16' }}>{trip.routeCode}</span>
            <span style={{ fontSize: 12, color: T.text }}>{trip.routeName}</span>
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
            {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            {trip.durationMinutes ? ` · ${Math.round(trip.durationMinutes)} min` : ''}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: c, background: `${c}15`, padding: '1px 7px', borderRadius: 4 }}>
          {trip.status}
        </div>
        {trip.finalPassengerCount !== null && trip.finalPassengerCount !== undefined && (
          <div style={{ fontSize: 10, color: T.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 3 }}>
            {trip.finalPassengerCount} pax
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatBox({ label, value, mono, accent, dim }: { label: string; value: string; mono?: boolean; accent?: string; dim?: boolean }) {
  return (
    <div style={{ padding: '10px 12px', background: '#0a1209', borderRadius: 8, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono ? 'JetBrains Mono, monospace' : 'IBM Plex Sans, sans-serif', color: dim ? T.muted : (accent ?? T.text) }}>
        {value}
      </div>
    </div>
  );
}

function AssignmentItem({ label, value, accent, dim }: { label: string; value: string; accent?: string; dim?: boolean }) {
  return (
    <div style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: T.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: dim ? T.muted : (accent ?? T.text) }}>{value}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[140, 80, 60].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .17s ease' }}>
        {children}
      </div>
    </div>
  );
}