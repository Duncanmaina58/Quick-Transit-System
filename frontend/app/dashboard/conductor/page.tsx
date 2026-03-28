/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { conductorApi } from '@/lib/api/driver';
import { AuthService } from '@/lib/utils/auth';
import type { TripResponse, TripSummaryResponse, PassengerLogType } from '@/types/api';

const V = {
  bg:      '#0f0f1a',
  surface: '#13132a',
  card:    '#16163a',
  border:  '#1e1e4a',
  violet:  '#8b5cf6',
  purple:  '#7c3aed',
  text:    '#ede9fe',
  muted:   '#5b5b99',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  cyan:    '#06b6d4',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0f0f1a', border: '1px solid #1e1e4a',
  borderRadius: 8, color: '#ede9fe',
  fontSize: 13, fontFamily: 'Space Mono, monospace', outline: 'none',
};

const LOG_TYPES: { value: PassengerLogType; label: string; color: string; icon: string }[] = [
  { value: 'Boarding',   label: 'Boarding',    color: V.success, icon: '↑' },
  { value: 'Alighting',  label: 'Alighting',   color: V.danger,  icon: '↓' },
  { value: 'Checkpoint', label: 'Checkpoint',  color: V.cyan,    icon: '●' },
];

export default function ConductorDashboardPage() {
  const qc   = useQueryClient();
  const user = AuthService.getUser();
  const [logModal, setLogModal]     = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripResponse | null>(null);
  const [elapsed, setElapsed]       = useState('00:00:00');

  // Get conductor's active trip (trips assigned to them)
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['conductor-trips-active'],
    queryFn: () => conductorApi.getMyTrips({ status: 'InProgress', page: 1, pageSize: 1 }),
    refetchInterval: 20000,
  });

  // Get recent trips
  const { data: histData } = useQuery({
    queryKey: ['conductor-trips-history'],
    queryFn: () => conductorApi.getMyTrips({ page: 1, pageSize: 10 }),
  });

  const inProgressTrips = tripsData?.data?.data ?? [];
  const history: TripSummaryResponse[] = histData?.data?.data ?? [];
  const currentSummary = inProgressTrips[0] ?? null;

  // Fetch full trip details if there's an active trip
  const { data: tripDetailData } = useQuery({
    queryKey: ['conductor-active-trip-detail', currentSummary?.id],
    queryFn: () => currentSummary ? conductorApi.getMyTrips({ status: 'InProgress', page: 1, pageSize: 1 }) : Promise.resolve(null),
    enabled: !!currentSummary,
  });

  // Set active trip from summary (we use summary data since conductorApi doesn't have getById)
  useEffect(() => {
    if (currentSummary && !activeTrip) {
      // Cast summary to minimal TripResponse shape
      setActiveTrip(currentSummary as unknown as TripResponse);
    } else if (!currentSummary) {
      setActiveTrip(null);
    }
  }, [currentSummary]);

  // Live timer
  useEffect(() => {
    if (!currentSummary?.actualStartTime) { setElapsed('00:00:00'); return; }
    const start = new Date(currentSummary.actualStartTime).getTime();
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
  }, [currentSummary?.actualStartTime]);

  // Log passengers mutation
  const logMut = useMutation({
    mutationFn: ({ tripId, count, stop, type }: { tripId: string; count: number; stop: string; type: PassengerLogType }) =>
      conductorApi.logPassengers(tripId, { passengerCount: count, stopName: stop || undefined, logType: type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conductor-trips-active'] });
      qc.invalidateQueries({ queryKey: ['conductor-trips-history'] });
      setLogModal(false);
      toast.success('Passengers logged ✓');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to log passengers.'),
  });

  // Stats
  const completedToday = history.filter(t => t.status === 'Completed' && isToday(t.actualStartTime)).length;
  const totalPax = history.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.finalPassengerCount ?? 0), 0);
  const avgPax   = history.filter(t => t.finalPassengerCount != null).length > 0
    ? Math.round(totalPax / history.filter(t => t.finalPassengerCount != null).length)
    : 0;

  return (
    <div style={{ padding: '24px', fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        input:focus, textarea:focus, select:focus { border-color: #8b5cf6 !important; }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes shimmer  { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.5)} 60%{box-shadow:0 0 0 12px rgba(139,92,246,0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
        @keyframes countUp  { from{transform:scale(1.2);color:#fff} to{transform:scale(1)} }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, color: V.text, letterSpacing: '-.3px' }}>
          {getGreeting()}, {user?.firstName} 👋
        </h1>
        <p style={{ fontSize: 11, color: V.muted, marginTop: 3, fontFamily: 'Space Mono, monospace' }}>
          {user?.employeeId} · {user?.saccoName ?? 'QuickTransit'}
        </p>
      </div>

      {isLoading ? <Skeleton /> : (
        <>
          {/* ── Active Trip / No Trip ─────────────────────────────────── */}
          {currentSummary ? (
            <ActiveTripWidget
              trip={currentSummary}
              elapsed={elapsed}
              onLog={() => setLogModal(true)}
            />
          ) : (
            <WaitingWidget />
          )}

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {[
              { label: 'Trips Today',  value: completedToday, color: V.violet },
              { label: 'Total Trips',  value: histData?.data?.totalCount ?? 0, color: '#7c3aed' },
              { label: 'Avg Pax',      value: avgPax,         color: V.cyan   },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: V.card, border: `1px solid ${V.border}`,
                borderRadius: 10, padding: '12px 14px',
                animation: `fadeUp .3s ease ${i*60}ms both`,
              }}>
                <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', color: V.muted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Recent trips ──────────────────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1.5px', color: V.muted, marginBottom: 10 }}>Recent Trips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.length === 0
                ? <EmptyState msg="No trips yet" />
                : history.map(t => <TripRow key={t.id} trip={t} />)
              }
            </div>
          </div>
        </>
      )}

      {/* ── Log Passengers Modal ───────────────────────────────────────── */}
      {logModal && currentSummary && (
        <LogPassengersModal
          tripId={currentSummary.id}
          routeCode={currentSummary.routeCode}
          routeName={currentSummary.routeName}
          onClose={() => setLogModal(false)}
          onSubmit={(count, stop, type) => logMut.mutate({ tripId: currentSummary.id, count, stop, type })}
          loading={logMut.isPending}
        />
      )}
    </div>
  );
}

// ── Active Trip Widget ────────────────────────────────────────────────────────
function ActiveTripWidget({ trip, elapsed, onLog }: {
  trip: TripSummaryResponse; elapsed: string; onLog: () => void;
}) {
  return (
    <div style={{
      background: V.card,
      border: `2px solid ${V.violet}`,
      borderRadius: 14, overflow: 'hidden',
      animation: 'shimmer 3s ease infinite, fadeUp .3s ease',
    }}>
      {/* Header bar */}
      <div style={{ background: 'linear-gradient(135deg, #2e1065, #3b0764)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', animation: 'blink 1.5s infinite' }} />
          <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>Active Trip</span>
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 700, color: '#a78bfa', letterSpacing: '2px' }}>
          {elapsed}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: V.violet, background: 'rgba(139,92,246,.12)', padding: '2px 8px', borderRadius: 5 }}>
            {trip.routeCode}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>{trip.routeName}</span>
        </div>

        {/* Info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <InfoBox label="Vehicle" value={trip.registrationPlate} />
          <InfoBox label="Driver"  value={trip.driverName} />
        </div>

        {/* BIG LOG button — primary action for conductors */}
        <button
          onClick={onLog}
          style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none', color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif', letterSpacing: '.5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ fontSize: 20 }}>🎫</span>
          Log Passengers
        </button>

        <p style={{ textAlign: 'center', fontSize: 10, color: V.muted, fontFamily: 'Space Mono, monospace', marginTop: 8 }}>
          Tap to record boardings, alightings and checkpoints
        </p>
      </div>
    </div>
  );
}

// ── Waiting Widget (no active trip) ───────────────────────────────────────────
function WaitingWidget() {
  return (
    <div style={{
      background: V.card, border: `1px solid ${V.border}`,
      borderRadius: 14, padding: '32px 20px',
      textAlign: 'center', animation: 'fadeUp .3s ease',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎫</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 6 }}>Waiting for Assignment</h2>
      <p style={{ fontSize: 12, color: V.muted, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
        You are not currently assigned to an active trip. When a driver starts a trip with you as conductor, it will appear here.
      </p>
      <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(139,92,246,.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,.2)', display: 'inline-block' }}>
        <span style={{ fontSize: 11, color: V.violet, fontFamily: 'Space Mono, monospace' }}>Contact your driver to get started</span>
      </div>
    </div>
  );
}

// ── Log Passengers Modal ──────────────────────────────────────────────────────
function LogPassengersModal({ tripId, routeCode, routeName, onClose, onSubmit, loading }: {
  tripId: string; routeCode: string; routeName: string;
  onClose: () => void;
  onSubmit: (count: number, stop: string, type: PassengerLogType) => void;
  loading: boolean;
}) {
  const [count, setCount] = useState('');
  const [stop, setStop]   = useState('');
  const [type, setType]   = useState<PassengerLogType>('Boarding');

  const handleSubmit = () => {
    const n = parseInt(count);
    if (!n || n < 0) { toast.error('Enter a valid passenger count'); return; }
    onSubmit(n, stop, type);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 380 }}>
        {/* Header with route */}
        <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #2e1065, #3b0764)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 3 }}>Log Passengers</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: V.violet, background: 'rgba(139,92,246,.2)', padding: '1px 7px', borderRadius: 4 }}>{routeCode}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{routeName}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '18px' }}>
          {/* Log type selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: V.muted, marginBottom: 8 }}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {LOG_TYPES.map(lt => (
                <button
                  key={lt.value}
                  onClick={() => setType(lt.value)}
                  style={{
                    padding: '10px 8px', borderRadius: 9, cursor: 'pointer',
                    border: `2px solid ${type === lt.value ? lt.color : V.border}`,
                    background: type === lt.value ? `${lt.color}18` : 'transparent',
                    color: type === lt.value ? lt.color : V.muted,
                    fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: type === lt.value ? 700 : 400,
                    transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{lt.icon}</span>
                  {lt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big passenger count input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: V.muted, marginBottom: 6 }}>Passenger Count *</label>
            <input
              type="number" min="1" max="200"
              style={{ ...inp, fontSize: 28, fontWeight: 700, textAlign: 'center', height: 64, color: V.violet, border: `2px solid ${V.border}` }}
              value={count}
              onChange={e => setCount(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Stop name */}
          <div>
            <label style={{ display: 'block', fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: V.muted, marginBottom: 6 }}>Stop Name (optional)</label>
            <input
              style={inp}
              value={stop}
              onChange={e => setStop(e.target.value)}
              placeholder="e.g. Globe Roundabout, Westgate..."
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '10px 16px', cursor: 'pointer', color: V.muted }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !count}
            style={{
              flex: 1, padding: '12px', borderRadius: 9,
              background: type === 'Boarding' ? V.success : type === 'Alighting' ? V.danger : V.cyan,
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: !count ? 'not-allowed' : 'pointer', opacity: loading || !count ? .5 : 1,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {loading ? 'Logging...' : `Log ${type}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Trip History Row ──────────────────────────────────────────────────────────
function TripRow({ trip }: { trip: TripSummaryResponse }) {
  const sc: Record<string, string> = { Completed: '#10b981', InProgress: '#8b5cf6', Cancelled: '#ef4444', Scheduled: '#f59e0b' };
  const c = sc[trip.status] ?? '#64748b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: V.card, borderRadius: 8, border: `1px solid ${V.border}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, color: V.violet }}>{trip.routeCode}</span>
            <span style={{ fontSize: 11, color: V.text }}>{trip.routeName}</span>
          </div>
          <div style={{ fontSize: 9, color: V.muted, fontFamily: 'Space Mono, monospace', marginTop: 1 }}>
            {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            {trip.driverName ? ` · ${trip.driverName}` : ''}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: c, background: `${c}15`, padding: '1px 6px', borderRadius: 4 }}>{trip.status}</div>
        {trip.finalPassengerCount != null && (
          <div style={{ fontSize: 9, color: V.muted, fontFamily: 'Space Mono, monospace', marginTop: 2 }}>{trip.finalPassengerCount} pax</div>
        )}
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 10px', background: V.surface, borderRadius: 7, border: `1px solid ${V.border}` }}>
      <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: V.text }}>{value}</div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <div style={{ padding: '20px', textAlign: 'center', background: V.card, borderRadius: 8, border: `1px solid ${V.border}`, fontSize: 11, color: V.muted, fontFamily: 'Space Mono, monospace' }}>{msg}</div>;
}

function Skeleton() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[130, 80, 60].map((h, i) => <div key={i} style={{ height: h, borderRadius: 12, background: V.card, border: `1px solid ${V.border}`, animation: 'pulse 1.5s infinite' }} />)}</div>;
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .17s ease' }}>
        {children}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}