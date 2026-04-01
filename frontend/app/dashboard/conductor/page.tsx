/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { conductorApi } from '@/lib/api/driver';
import { alertApi } from '@/lib/api/alerts';
import { locationApi } from '@/lib/api/location';
import { AuthService } from '@/lib/utils/auth';
import { useGoogleMaps, DARK_MAP_STYLE, } from '@/lib/hooks/useGoogleMaps';
import type {
  TripSummaryResponse, ShiftContextResponse,
  LiveTripResponse, PassengerLogType,
} from '@/types/api';

const V = {
  bg: '#0f0f1a', surface: '#13132a', card: '#16163a',
  border: '#1e1e4a', violet: '#8b5cf6', purple: '#7c3aed',
  text: '#ede9fe', muted: '#5b5b99',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444', cyan: '#06b6d4',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0f0f1a', border: '1px solid #1e1e4a',
  borderRadius: 8, color: '#ede9fe',
  fontSize: 13, fontFamily: 'Space Mono, monospace', outline: 'none',
};

const LOG_TYPES = [
  { value: 'Boarding' as PassengerLogType,   label: 'Boarding',   color: '#10b981', icon: '↑' },
  { value: 'Alighting' as PassengerLogType,  label: 'Alighting',  color: '#ef4444', icon: '↓' },
  { value: 'Checkpoint' as PassengerLogType, label: 'Check',      color: '#06b6d4', icon: '●' },
];

type Screen = 'loading' | 'no-assignment' | 'waiting' | 'active';

export default function ConductorDashboardPage() {
  const qc        = useQueryClient();
  const user      = AuthService.getUser();
  const { loaded: mapsReady, error } = useGoogleMaps(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!
);
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapObj    = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const pathRef   = useRef<google.maps.Polyline | null>(null);

  const [screen, setScreen]     = useState<Screen>('loading');
  const [elapsed, setElapsed]   = useState('00:00:00');
  const [logModal, setLogModal] = useState(false);
  const [quickCount, setQuickCount] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: shiftData } = useQuery({
    queryKey: ['conductor-shift'],
    queryFn:  () => alertApi.getMyShift(),
    refetchInterval: 60000,
  });
  const shift: ShiftContextResponse | null = shiftData?.data?.data ?? null;

  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['conductor-active-trip'],
    queryFn:  () => conductorApi.getMyTrips({ status: 'InProgress', page: 1, pageSize: 1 }),
    refetchInterval: 15000,
  });
  const currentTrip: TripSummaryResponse | null = tripsData?.data?.data?.[0] ?? null;

  const { data: liveData } = useQuery({
    queryKey: ['conductor-live', currentTrip?.id],
    queryFn:  () => currentTrip?.id ? alertApi.getLiveTrip(currentTrip.id) : Promise.resolve(null),
    enabled:  !!currentTrip?.id,
    refetchInterval: 8000,
  });
  const live: LiveTripResponse | null = liveData?.data?.data ?? null;

  const { data: histData } = useQuery({
    queryKey: ['conductor-history'],
    queryFn:  () => conductorApi.getMyTrips({ page: 1, pageSize: 6 }),
  });
  const history: TripSummaryResponse[] = histData?.data?.data ?? [];

  // ── Screen ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) { setScreen('loading'); return; }
    if (!shift?.isAssigned) { setScreen('no-assignment'); return; }
    if (currentTrip) { setScreen('active'); return; }
    setScreen('waiting');
  }, [shift, currentTrip, isLoading]);

  // ── Elapsed ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrip?.actualStartTime) { setElapsed('00:00:00'); return; }
    const s = new Date(currentTrip.actualStartTime).getTime();
    const tick = () => {
      const d = Date.now() - s;
      setElapsed(`${Math.floor(d/3600000).toString().padStart(2,'0')}:${Math.floor((d%3600000)/60000).toString().padStart(2,'0')}:${Math.floor((d%60000)/1000).toString().padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [currentTrip?.actualStartTime]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapObj.current) return;
    const violetMapStyle = DARK_MAP_STYLE.map(s =>
      s.elementType === 'geometry' ? { ...s, stylers: [{ color: '#0f0f1a' }] } :
      s.featureType === 'road' && s.elementType === 'geometry' ? { ...s, stylers: [{ color: '#1e1e4a' }] } :
      s
    );
    violetMapStyle.push({ featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b5cf6' }] });

    mapObj.current = new google.maps.Map(mapRef.current, {
      center:           { lat: -1.2921, lng: 36.8219 },
      zoom:             13,
      styles:           violetMapStyle,
      disableDefaultUI: true,
      zoomControl:      true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling:  'greedy',
    });
  }, [mapsReady]);

  // ── Update map from live data ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapObj.current) return;

    // Position marker from live data
    if (live?.currentLatitude && live?.currentLongitude) {
      const pos = { lat: Number(live.currentLatitude), lng: Number(live.currentLongitude) };
      const plate = currentTrip?.registrationPlate ?? '';

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: pos,
          map: mapObj.current,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('#8b5cf6', plate),
            anchor: new google.maps.Point(28, 28),
          },
        });
        mapObj.current.panTo(pos);
      } else {
        markerRef.current.setPosition(pos);
      }
    }

    // Draw path
    if (live?.recentPath?.length) {
      const path = live.recentPath.map(p => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));
      if (!pathRef.current) {
        pathRef.current = new google.maps.Polyline({
          path, map: mapObj.current,
          strokeColor: '#8b5cf6', strokeOpacity: 0.5, strokeWeight: 3,
        });
      } else {
        pathRef.current.setPath(path);
      }
    }
  }, [mapsReady, live?.currentLatitude, live?.currentLongitude, live?.recentPath]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const logMut = useMutation({
    mutationFn: ({ count, stop, type }: { count: number; stop: string; type: PassengerLogType }) =>
      conductorApi.logPassengers(currentTrip!.id, { passengerCount: count, stopName: stop || undefined, logType: type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conductor-live'] });
      setLogModal(false);
      setQuickCount(0);
      toast.success('Logged ✓');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const quickLogMut = useMutation({
    mutationFn: ({ count, type }: { count: number; type: PassengerLogType }) =>
      conductorApi.logPassengers(currentTrip!.id, { passengerCount: count, logType: type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conductor-live'] });
      setQuickCount(0);
      toast.success(`${quickCount} pax logged ✓`, { duration: 1500 });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const pax         = live?.currentPassengerCount ?? 0;
  const capacity    = live?.vehicleCapacity ?? shift?.vehicleCapacity ?? 14;
  const isOverloaded = live?.isOverloaded ?? false;
  const paxPct      = Math.min(Math.round((pax / capacity) * 100), 100);
  const todayTrips  = history.filter(t => t.status === 'Completed' && isToday(t.actualStartTime)).length;

  return (
    <div style={{ minHeight: '100vh', background: V.bg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: #8b5cf6 !important; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes shimmer { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.5)} 60%{box-shadow:0 0 0 14px rgba(139,92,246,0)} }
        @keyframes danger  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.6)} 60%{box-shadow:0 0 0 14px rgba(239,68,68,0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* Top bar */}
      <div style={{ height: 52, background: V.surface, borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6v6a3 3 0 010 6H2a3 3 0 010-6V9z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.text }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', color: V.violet, textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.employeeId}</div>
          </div>
        </div>
        {screen === 'active' && (
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: '#a78bfa', letterSpacing: '2px' }}>{elapsed}</div>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: mapExpanded ? 'calc(100vh - 52px)' : 200, flexShrink: 0, position: 'relative', background: V.bg, transition: 'height .3s ease' }}
      >
        {!mapsReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: V.bg }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${V.border}`, borderTopColor: V.violet, animation: 'spin .7s linear infinite' }} />
          </div>
        )}
        {/* Map overlay: route code */}
        {currentTrip && (
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(15,15,26,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'blink 1.5s infinite' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: V.violet, fontWeight: 700 }}>{currentTrip.routeCode}</span>
          </div>
        )}
        {/* Speed from live data */}
        {live?.currentSpeedKmh != null && (
          <div style={{ position: 'absolute', top: 10, right: 48, zIndex: 5, padding: '4px 8px', borderRadius: 7, background: 'rgba(15,15,26,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${V.border}` }}>
            <span style={{ fontSize: 13, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: V.violet }}>{Math.round(live.currentSpeedKmh)}</span>
            <span style={{ fontSize: 8, color: V.muted, fontFamily: 'Space Mono, monospace', marginLeft: 2 }}>km/h</span>
          </div>
        )}
        <button onClick={() => setMapExpanded(e => !e)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, width: 30, height: 30, borderRadius: 7, background: 'rgba(15,15,26,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${V.border}`, cursor: 'pointer', color: V.muted, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {mapExpanded ? '⊡' : '⊞'}
        </button>
      </div>

      {/* Content */}
      {!mapExpanded && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 28px' }}>

          {screen === 'loading' && (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${V.border}`, borderTopColor: V.violet, animation: 'spin .7s linear infinite', margin: '0 auto' }} />
            </div>
          )}

          {screen === 'no-assignment' && (
            <div style={{ padding: '20px 4px', animation: 'fadeUp .3s ease' }}>
              <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎫</div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: V.text, marginBottom: 6 }}>Not Assigned</h2>
                <p style={{ fontSize: 11, color: V.muted, lineHeight: 1.6 }}>Contact your SACCO manager to get assigned to a vehicle.</p>
              </div>
            </div>
          )}

          {screen === 'waiting' && shift && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: 'rgba(139,92,246,.05)', borderBottom: `1px solid ${V.border}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: V.muted }} />
                  <span style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', color: V.muted, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Waiting for Driver</span>
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <IB label="Vehicle"   value={shift.assignedVehiclePlate ?? '—'} />
                    <IB label="Driver"    value={shift.driverName ?? '—'} />
                  </div>
                  {shift.assignedRouteName && (
                    <div style={{ padding: '8px 10px', background: '#0f0f1a', borderRadius: 7, border: `1px solid ${V.border}` }}>
                      <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 3 }}>Route</div>
                      <div style={{ fontSize: 11, color: V.text }}>{shift.assignedRouteOrigin} → {shift.assignedRouteDestination}</div>
                    </div>
                  )}
                  <div style={{ marginTop: 12, padding: '10px', background: 'rgba(139,92,246,.05)', borderRadius: 8, border: '1px solid rgba(139,92,246,.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: V.muted }}>⏳ Will activate when driver starts trip</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatB label="Today's Trips" value={todayTrips} color={V.violet} />
                <StatB label="Total Trips"   value={histData?.data?.totalCount ?? 0} color={V.cyan} />
              </div>
            </div>
          )}

          {screen === 'active' && currentTrip && (
            <div style={{ animation: 'fadeUp .3s ease' }}>

              {/* Overload */}
              {isOverloaded && (
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 10, background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.5)', animation: 'danger 2s ease infinite', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>🚨</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: V.danger }}>OVERLOADED! {pax}/{capacity}</div>
                    <div style={{ fontSize: 10, color: '#fca5a5' }}>Ask passengers to alight now</div>
                  </div>
                </div>
              )}

              {/* Trip header */}
              <div style={{ background: V.card, border: `2px solid ${isOverloaded ? V.danger : V.violet}`, borderRadius: 14, overflow: 'hidden', animation: isOverloaded ? 'danger 2s ease infinite' : 'shimmer 3s ease infinite', marginBottom: 10 }}>
                <div style={{ background: 'linear-gradient(135deg,#2e1065,#3b0764)', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', animation: 'blink 1.5s infinite' }} />
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Active Trip</span>
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#a78bfa' }}>{currentTrip.registrationPlate}</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: V.violet, background: 'rgba(139,92,246,.12)', padding: '1px 7px', borderRadius: 4 }}>{currentTrip.routeCode}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: V.text }}>{currentTrip.routeName}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <IB label="Vehicle" value={currentTrip.registrationPlate} />
                    <IB label="Driver"  value={currentTrip.driverName} />
                  </div>
                </div>
              </div>

              {/* Big counter */}
              <div style={{ background: V.card, border: `1px solid ${isOverloaded ? V.danger : V.border}`, borderRadius: 14, padding: '16px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1.5px', color: V.muted, textAlign: 'center', marginBottom: 12 }}>Current Passengers</div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 64, fontWeight: 700, lineHeight: 1, color: isOverloaded ? V.danger : V.violet }}>{pax}</div>
                  <div style={{ fontSize: 13, color: V.muted, fontFamily: 'Space Mono, monospace', marginTop: 2 }}>/ {capacity} seats</div>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: V.border, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${paxPct}%`, background: isOverloaded ? V.danger : paxPct > 80 ? V.warning : V.violet, borderRadius: 5, transition: 'width .5s, background .3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'Space Mono, monospace', color: V.muted, marginBottom: 16 }}>
                  <span>{paxPct}% full</span>
                  <span>{capacity - pax} seats left</span>
                </div>

                {/* Quick counter */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 8, textAlign: 'center' }}>Quick Log</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 10 }}>
                    <button onClick={() => setQuickCount(Math.max(0, quickCount - 1))} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.3)', color: V.danger, fontSize: 22, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 32, fontWeight: 700, color: V.text, minWidth: 56, textAlign: 'center' }}>{quickCount}</div>
                    <button onClick={() => setQuickCount(quickCount + 1)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,.1)', border: '2px solid rgba(16,185,129,.3)', color: V.success, fontSize: 22, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button onClick={() => quickCount > 0 && quickLogMut.mutate({ count: quickCount, type: 'Boarding' })} disabled={quickCount === 0 || quickLogMut.isPending}
                      style={{ padding: '11px', borderRadius: 9, background: quickCount > 0 ? 'rgba(16,185,129,.15)' : 'rgba(16,185,129,.04)', border: `2px solid ${quickCount > 0 ? 'rgba(16,185,129,.4)' : 'rgba(16,185,129,.1)'}`, color: quickCount > 0 ? V.success : V.muted, fontSize: 12, fontWeight: 700, cursor: quickCount > 0 ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      ↑ Boarded
                    </button>
                    <button onClick={() => quickCount > 0 && quickLogMut.mutate({ count: quickCount, type: 'Alighting' })} disabled={quickCount === 0 || quickLogMut.isPending}
                      style={{ padding: '11px', borderRadius: 9, background: quickCount > 0 ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.03)', border: `2px solid ${quickCount > 0 ? 'rgba(239,68,68,.35)' : 'rgba(239,68,68,.08)'}`, color: quickCount > 0 ? V.danger : V.muted, fontSize: 12, fontWeight: 700, cursor: quickCount > 0 ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      ↓ Alighted
                    </button>
                  </div>
                </div>

                <button onClick={() => setLogModal(true)} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  🎫 Detailed Log
                </button>
              </div>

              {/* Recent logs */}
              {(live?.recentLogs ?? []).length > 0 && (
                <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '7px 12px', borderBottom: `1px solid ${V.border}`, fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, letterSpacing: '1px' }}>Recent Logs</div>
                  {[...(live?.recentLogs ?? [])].reverse().slice(0, 4).map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: `1px solid rgba(30,30,74,.4)` }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: log.logType === 'Boarding' ? V.success : log.logType === 'Alighting' ? V.danger : V.cyan }}>{log.logType === 'Boarding' ? '↑' : log.logType === 'Alighting' ? '↓' : '●'}</span>
                        <div>
                          <div style={{ fontSize: 10, color: V.text }}>{log.stopName ?? 'No stop'}</div>
                          <div style={{ fontSize: 8, color: V.muted, fontFamily: 'Space Mono, monospace' }}>{new Date(log.logTime).toLocaleTimeString('en-KE', { timeStyle: 'short' })}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 15, fontWeight: 700, color: V.violet }}>{log.passengerCount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed log modal */}
      {logModal && currentTrip && (
        <Overlay onClose={() => setLogModal(false)}>
          <DetailedLogModal
            tripId={currentTrip.id}
            routeCode={currentTrip.routeCode}
            routeName={currentTrip.routeName}
            stops={live?.stops ?? []}
            onClose={() => setLogModal(false)}
            onSubmit={(count, stop, type) => logMut.mutate({ count, stop, type })}
            loading={logMut.isPending}
          />
        </Overlay>
      )}
    </div>
  );
}

// ── Detailed Log Modal ────────────────────────────────────────────────────────
function DetailedLogModal({ tripId, routeCode, routeName, stops, onClose, onSubmit, loading }: any) {
  const [count, setCount] = useState('');
  const [stop, setStop]   = useState('');
  const [type, setType]   = useState<PassengerLogType>('Boarding');
  return (
    <div>
      <div style={{ padding: '13px 16px', background: 'linear-gradient(135deg,#2e1065,#3b0764)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 3 }}>Detailed Log</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,.2)', padding: '1px 7px', borderRadius: 4 }}>{routeCode}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{routeName}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: '#5b5b99', marginBottom: 8 }}>Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {LOG_TYPES.map(lt => (
              <button key={lt.value} onClick={() => setType(lt.value)} style={{ padding: '9px 6px', borderRadius: 9, cursor: 'pointer', border: `2px solid ${type === lt.value ? lt.color : '#1e1e4a'}`, background: type === lt.value ? `${lt.color}18` : 'transparent', color: type === lt.value ? lt.color : '#5b5b99', fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: type === lt.value ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 18 }}>{lt.icon}</span>{lt.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: '#5b5b99', marginBottom: 5 }}>Count *</label>
          <input type="number" min="1" max="200" autoFocus style={{ ...inp, fontSize: 26, fontWeight: 700, textAlign: 'center', height: 60, color: '#8b5cf6', border: '2px solid #1e1e4a' }} value={count} onChange={e => setCount(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: '#5b5b99', marginBottom: 5 }}>Stop (optional)</label>
          {stops.length > 0 ? (
            <select style={inp} value={stop} onChange={e => setStop(e.target.value)}>
              <option value="">Select stop...</option>
              {stops.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input style={inp} value={stop} onChange={e => setStop(e.target.value)} placeholder="e.g. Globe Roundabout..." />
          )}
        </div>
      </div>
      <div style={{ padding: '0 16px 24px', display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '11px 14px', cursor: 'pointer', color: '#5b5b99' }}>Cancel</button>
        <button onClick={() => { const n = parseInt(count); if (n > 0) onSubmit(n, stop, type); else toast.error('Enter a count'); }}
          disabled={loading || !count}
          style={{ flex: 1, padding: '12px', borderRadius: 9, background: type === 'Boarding' ? '#10b981' : type === 'Alighting' ? '#ef4444' : '#06b6d4', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: !count ? 'not-allowed' : 'pointer', opacity: loading || !count ? .5 : 1, fontFamily: 'Nunito, sans-serif' }}>
          {loading ? 'Logging...' : `Log ${type}`}
        </button>
      </div>
    </div>
  );
}

function IB({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '7px 9px', background: V.surface, borderRadius: 7, border: `1px solid ${V.border}` }}>
      <div style={{ fontSize: 7, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: V.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}
function StatB({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 10, padding: '11px 12px' }}>
      <div style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', color: V.muted, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Mono, monospace', color }}>{value}</div>
    </div>
  );
}
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.87)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '14px 14px 0 0', overflow: 'hidden', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn .2s ease' }}>
        {children}
      </div>
    </div>
  );
}
function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}