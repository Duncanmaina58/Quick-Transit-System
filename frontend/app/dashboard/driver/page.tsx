/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { driverApi } from '@/lib/api/driver';
import { alertApi } from '@/lib/api/alerts';
import { locationApi } from '@/lib/api/location';
import { AuthService } from '@/lib/utils/auth';
import { useGoogleMaps,  } from '@/lib/hooks/useGoogleMaps';
import type {
  DriverTripContextResponse, TripResponse, TripSummaryResponse,
  ShiftContextResponse, LiveTripResponse,
} from '@/types/api';

const G = {
  bg: '#0a1209', surface: '#0d1a0d', card: '#111f11',
  border: '#1a3320', green: '#22c55e', lime: '#84cc16',
  text: '#e8f5e9', muted: '#4d7a52', danger: '#ef4444',
  warning: '#f59e0b', amber: '#f97316',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#0a1209', border: '1px solid #1a3320',
  borderRadius: 8, color: '#e8f5e9',
  fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none',
};

const INCIDENT_TYPES = [
  { value: 'Accident',   label: 'Accident',    icon: '🚨', color: '#ef4444' },
  { value: 'Breakdown',  label: 'Breakdown',   icon: '🔧', color: '#f97316' },
  { value: 'PoliceStop', label: 'Police Stop', icon: '🚔', color: '#f59e0b' },
  { value: 'TrafficJam', label: 'Traffic Jam', icon: '🚗', color: '#06b6d4' },
  { value: 'Other',      label: 'Other',       icon: '📋', color: '#64748b' },
];

type Screen  = 'loading' | 'no-assignment' | 'idle' | 'active';
type Modal   = 'start' | 'end' | 'cancel' | 'incident' | null;

export default function DriverDashboardPage() {
  const qc          = useQueryClient();
  const user        = AuthService.getUser();
  const { loaded: mapsReady, error } = useGoogleMaps(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!
);
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapObj      = useRef<google.maps.Map | null>(null);
  const markerRef   = useRef<google.maps.Marker | null>(null);
  const pathRef     = useRef<google.maps.Polyline | null>(null);
  const watchIdRef  = useRef<number | null>(null);

  const [screen, setScreen]   = useState<Screen>('loading');
  const [modal, setModal]     = useState<Modal>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [now, setNow]         = useState('');
  const [gpsStatus, setGpsStatus] = useState<'off' | 'on' | 'error'>('off');
  const [mapExpanded, setMapExpanded] = useState(false);

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: shiftData } = useQuery({
    queryKey: ['driver-shift'],
    queryFn:  () => alertApi.getMyShift(),
    refetchInterval: 60000,
  });
  const shift: ShiftContextResponse | null = shiftData?.data?.data ?? null;

  const { data: ctxData, isLoading: ctxLoading } = useQuery({
    queryKey: ['driver-context'],
    queryFn:  () => driverApi.getMyContext(),
    refetchInterval: 15000,
  });
  const ctx: DriverTripContextResponse | null = ctxData?.data?.data ?? null;
  const trip = ctx?.activeTrip;

  const { data: liveData } = useQuery({
    queryKey: ['driver-live', trip?.id],
    queryFn:  () => trip?.id ? alertApi.getLiveTrip(trip.id) : Promise.resolve(null),
    enabled:  !!trip?.id,
    refetchInterval: 8000,
  });
  const live: LiveTripResponse | null = liveData?.data?.data ?? null;

  const { data: histData } = useQuery({
    queryKey: ['driver-trips-history'],
    queryFn:  () => driverApi.getMyTrips({ page: 1, pageSize: 5 }),
  });
  const history: TripSummaryResponse[] = histData?.data?.data ?? [];

  // ── Screen logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (ctxLoading) { setScreen('loading'); return; }
    if (!shift?.isAssigned) { setScreen('no-assignment'); return; }
    if (ctx?.hasActiveTrip) { setScreen('active'); return; }
    setScreen('idle');
  }, [shift, ctx, ctxLoading]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const start = trip?.actualStartTime;
    if (!start) { setElapsed('00:00:00'); return; }
    const s = new Date(start).getTime();
    const tick = () => {
      const d = Date.now() - s;
      setElapsed(`${Math.floor(d/3600000).toString().padStart(2,'0')}:${Math.floor((d%3600000)/60000).toString().padStart(2,'0')}:${Math.floor((d%60000)/1000).toString().padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [trip?.actualStartTime]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapObj.current) return;
    // Default center: Nairobi CBD
    mapObj.current = new google.maps.Map(mapRef.current, {
      center:            { lat: -1.2921, lng: 36.8219 },
      zoom:              13,
      // styles:            DARK_MAP_STYLE,
      disableDefaultUI:  true,
      zoomControl:       true,
      zoomControlOptions:{ position: google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling:   'greedy',
    });
  }, [mapsReady]);

  // ── GPS location posting (when trip active) ───────────────────────────────
  const postLocationMut = useMutation({
    mutationFn: (pos: GeolocationPosition) => {
      if (!trip?.id) return Promise.resolve();
      return locationApi.postLocation(trip.id, {
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
        speed:     pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined, // m/s → km/h
        heading:   pos.coords.heading ?? undefined,
        accuracy:  pos.coords.accuracy,
      });
    },
  });

  // Start / stop GPS watch when trip active
  useEffect(() => {
    if (screen !== 'active' || !trip?.id) {
      // Stop watching
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setGpsStatus('off');
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('error');
      toast.error('GPS not available on this device.');
      return;
    }

    setGpsStatus('on');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('on');
        postLocationMut.mutate(pos);
        // Pan map to current position
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapObj.current) {
          if (!markerRef.current) {
            markerRef.current = new google.maps.Marker({
              position: latlng,
              map:      mapObj.current,
              icon: {
                url:    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(busMarkerSvg('#22c55e', trip.registrationPlate ?? '', pos.coords.heading ?? undefined)),
                anchor: new google.maps.Point(28, 28),
              },
              title: trip.registrationPlate,
            });
          } else {
            markerRef.current.setPosition(latlng);
            markerRef.current.setIcon({
              url:    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(busMarkerSvg('#22c55e', trip.registrationPlate ?? '', pos.coords.heading ?? undefined)),
              anchor: new google.maps.Point(28, 28),
            });
          }
          mapObj.current.panTo(latlng);
        }
      },
      (err) => {
        setGpsStatus('error');
        console.error('GPS error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [screen, trip?.id]);

  // ── Draw path from live data ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapObj.current || !live?.recentPath?.length) return;
    const path = live.recentPath.map(p => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));

    if (!pathRef.current) {
      pathRef.current = new google.maps.Polyline({
        path,
        map:        mapObj.current,
        strokeColor: '#22c55e',
        strokeOpacity: 0.6,
        strokeWeight: 3,
        icons: [{
          icon:   { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2 },
          offset: '100%',
          repeat: '60px',
        }],
      });
    } else {
      pathRef.current.setPath(path);
    }
  }, [mapsReady, live?.recentPath]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const startMut = useMutation({
    mutationFn: (req: { initialPassengerCount: number; notes: string }) =>
      driverApi.startTrip({ vehicleId: shift!.assignedVehicleId!, routeId: shift!.assignedRouteId!, ...req }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-context'] }); setModal(null); toast.success('Trip started! 🚌'); },
    onError:   (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });
  const endMut = useMutation({
    mutationFn: (req: { count: number; notes: string }) =>
      driverApi.endTrip(trip!.id, { finalPassengerCount: req.count, notes: req.notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-context'] }); qc.invalidateQueries({ queryKey: ['driver-trips-history'] }); setModal(null); toast.success('Trip completed! ✅'); },
    onError:   (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });
  const cancelMut = useMutation({
    mutationFn: (reason: string) => driverApi.cancelTrip(trip!.id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-context'] }); setModal(null); toast.success('Trip cancelled.'); },
    onError:   (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });
  const incidentMut = useMutation({
    mutationFn: (req: { type: string; description: string }) =>
      alertApi.createIncident({ type: req.type, severity: req.type === 'Accident' ? 'critical' : 'medium', description: req.description, vehicleId: shift?.assignedVehicleId, tripId: trip?.id }),
    onSuccess: () => { setModal(null); toast.success('Incident reported.'); },
    onError:   (e: any) => toast.error(e.response?.data?.message ?? 'Failed.'),
  });

  const pax          = live?.currentPassengerCount ?? trip?.initialPassengerCount ?? 0;
  const capacity     = live?.vehicleCapacity ?? 14;
  const isOverloaded = live?.isOverloaded ?? false;
  const paxPct       = Math.min(Math.round((pax / capacity) * 100), 100);

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'Barlow, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: #22c55e !important; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)} 60%{box-shadow:0 0 0 14px rgba(34,197,94,0)} }
        @keyframes warnGlow{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 60%{box-shadow:0 0 0 14px rgba(239,68,68,0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{ height: 52, background: G.surface, borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M8 4v5M16 4v5M6 18v2M18 18v2"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.text }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: G.green, textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.employeeId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* GPS status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: gpsStatus === 'on' ? G.green : gpsStatus === 'error' ? G.danger : G.muted, animation: gpsStatus === 'on' ? 'blink 2s infinite' : 'none' }} />
            <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: gpsStatus === 'on' ? G.green : G.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>GPS</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: G.lime, letterSpacing: '2px' }}>{now}</div>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <div
        ref={mapRef}
        style={{
          height: mapExpanded ? 'calc(100vh - 52px)' : 220,
          flexShrink: 0, position: 'relative', transition: 'height .3s ease',
          background: '#0a1209', cursor: 'pointer',
        }}
      >
        {/* Map loading state */}
        {!mapsReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1209', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${G.border}`, borderTopColor: G.green, animation: 'spin .7s linear infinite', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 10, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>Loading map...</div>
            </div>
          </div>
        )}

        {/* Map overlay controls */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {trip && (
            <div style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(10,18,9,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.lime, animation: 'blink 1.5s infinite' }} />
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: G.lime, fontWeight: 700 }}>{trip.routeCode}</span>
              <span style={{ fontSize: 9, color: G.muted }}>LIVE</span>
            </div>
          )}
          {live?.currentSpeedKmh != null && (
            <div style={{ padding: '4px 8px', borderRadius: 7, background: 'rgba(10,18,9,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${G.border}` }}>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: G.green }}>{Math.round(live.currentSpeedKmh)}</span>
              <span style={{ fontSize: 8, color: G.muted, fontFamily: 'JetBrains Mono, monospace', marginLeft: 3 }}>km/h</span>
            </div>
          )}
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setMapExpanded(e => !e)}
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 32, height: 32, borderRadius: 8, background: 'rgba(10,18,9,.85)', backdropFilter: 'blur(8px)', border: `1px solid ${G.border}`, cursor: 'pointer', color: G.muted, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {mapExpanded ? '⊡' : '⊞'}
        </button>
      </div>

      {/* ── Scrollable content below map ──────────────────────────── */}
      {!mapExpanded && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px' }}>

          {/* LOADING */}
          {screen === 'loading' && (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${G.border}`, borderTopColor: G.green, animation: 'spin .7s linear infinite', margin: '0 auto' }} />
            </div>
          )}

          {/* NO ASSIGNMENT */}
          {screen === 'no-assignment' && <NoAssignment />}

          {/* IDLE */}
          {screen === 'idle' && shift && (
            <IdleCard shift={shift} history={history} onStart={() => setModal('start')} onIncident={() => setModal('incident')} />
          )}

          {/* ACTIVE TRIP */}
          {screen === 'active' && trip && (
            <div style={{ animation: 'fadeUp .3s ease' }}>

              {/* Overload */}
              {isOverloaded && (
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 10, background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.5)', animation: 'warnGlow 2s ease infinite', display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🚨</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.danger }}>OVERLOADED — {pax}/{capacity}</div>
                    <div style={{ fontSize: 10, color: '#fca5a5' }}>Ask passengers to alight</div>
                  </div>
                </div>
              )}

              {/* Trip card */}
              <div style={{ background: G.card, border: `2px solid ${isOverloaded ? G.danger : G.green}`, borderRadius: 14, overflow: 'hidden', animation: isOverloaded ? 'warnGlow 2s ease infinite' : 'glow 3s ease infinite', marginBottom: 10 }}>
                <div style={{ background: isOverloaded ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' : 'linear-gradient(135deg,#14532d,#166534)', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: G.lime, animation: 'blink 1.5s infinite' }} />
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>In Progress</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: G.lime, letterSpacing: '2px' }}>{elapsed}</span>
                </div>

                <div style={{ padding: '12px 14px' }}>
                  {/* Route */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.lime, background: 'rgba(132,204,22,.12)', padding: '1px 7px', borderRadius: 4 }}>{trip.routeCode}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: G.text }}>{trip.routeName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}`, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.green }} />
                    <span style={{ fontSize: 10, color: G.text }}>{trip.origin}</span>
                    <div style={{ flex: 1, height: 1, background: G.border }} />
                    <span style={{ fontSize: 10, color: G.text }}>{trip.destination}</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.danger }} />
                  </div>

                  {/* Passenger bar */}
                  <div style={{ padding: '10px 12px', background: '#0a1209', borderRadius: 8, border: `2px solid ${isOverloaded ? G.danger : G.border}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 1 }}>Passengers</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: isOverloaded ? G.danger : G.lime, lineHeight: 1 }}>{pax}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 1 }}>Capacity</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: G.muted }}>{capacity}</div>
                      </div>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: G.border, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${paxPct}%`, background: isOverloaded ? G.danger : paxPct > 80 ? G.warning : G.green, borderRadius: 4, transition: 'width .5s ease' }} />
                    </div>
                    <div style={{ fontSize: 8, color: G.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                      {paxPct}% · {live?.peakPassengerCount ? `Peak: ${live.peakPassengerCount}` : ''}
                    </div>
                  </div>

                  {/* Vehicle + conductor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <MiniBox label="Vehicle"   value={trip.registrationPlate} mono accent={G.lime} />
                    <MiniBox label="Conductor" value={trip.conductorName ?? 'None'} accent={G.green} />
                  </div>

                  {/* Recent conductor logs */}
                  {(live?.recentLogs ?? []).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 5 }}>Conductor Updates</div>
                      {[...(live?.recentLogs ?? [])].reverse().slice(0, 3).map(log => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#0a1209', borderRadius: 5, border: `1px solid ${G.border}`, marginBottom: 3 }}>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <span style={{ fontSize: 9, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>{new Date(log.logTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ fontSize: 9, color: log.logType === 'Boarding' ? G.green : log.logType === 'Alighting' ? G.danger : '#06b6d4' }}>{log.logType}</span>
                            {log.stopName && <span style={{ fontSize: 9, color: G.muted }}>{log.stopName}</span>}
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: G.lime }}>{log.passengerCount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 7 }}>
                    <button onClick={() => setModal('end')} style={{ padding: '12px', borderRadius: 9, background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow, sans-serif' }}>✓ End Trip</button>
                    <button onClick={() => setModal('incident')} style={{ padding: '12px 11px', borderRadius: 9, background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.3)', color: G.amber, fontSize: 13, cursor: 'pointer' }}>🚨</button>
                    <button onClick={() => setModal('cancel')} style={{ padding: '12px 11px', borderRadius: 9, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: G.danger, fontSize: 13, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              </div>

              {/* Recent trips */}
              {history.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 8 }}>Recent Trips</div>
                  {history.slice(0, 3).map(t => <HistRow key={t.id} trip={t} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {modal === 'start' && shift && <StartModal shift={shift} onClose={() => setModal(null)} onSubmit={r => startMut.mutate(r)} loading={startMut.isPending} />}
      {modal === 'end' && trip && <EndModal trip={trip} elapsed={elapsed} onClose={() => setModal(null)} onSubmit={d => endMut.mutate(d)} loading={endMut.isPending} />}
      {modal === 'cancel' && trip && <CancelModal trip={trip} onClose={() => setModal(null)} onConfirm={r => cancelMut.mutate(r)} loading={cancelMut.isPending} />}
      {modal === 'incident' && <IncidentModal onClose={() => setModal(null)} onSubmit={(t, d) => incidentMut.mutate({ type: t, description: d })} loading={incidentMut.isPending} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function NoAssignment() {
  return (
    <div style={{ padding: '20px 4px', animation: 'fadeUp .3s ease' }}>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🚌</div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6 }}>No Assignment</h2>
        <p style={{ fontSize: 11, color: G.muted, lineHeight: 1.6 }}>Contact your SACCO manager to get assigned to a vehicle and route.</p>
      </div>
    </div>
  );
}

function IdleCard({ shift, history, onStart, onIncident }: { shift: ShiftContextResponse; history: TripSummaryResponse[]; onStart: () => void; onIncident: () => void }) {
  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ background: 'rgba(34,197,94,.05)', borderBottom: `1px solid ${G.border}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.green }} />
          <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: G.green, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Ready</span>
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <MiniBox label="Vehicle" value={shift.assignedVehiclePlate ?? '—'} mono accent={G.lime} />
            <MiniBox label="Conductor" value={shift.conductorName ?? 'None'} accent={G.green} />
          </div>
          {shift.assignedRouteName && (
            <div style={{ padding: '8px 10px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 3 }}>Route</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G.lime, background: 'rgba(132,204,22,.1)', padding: '1px 6px', borderRadius: 4 }}>{shift.assignedRouteCode}</span>
                <span style={{ fontSize: 11, color: G.muted }}>{shift.assignedRouteOrigin} → {shift.assignedRouteDestination}</span>
              </div>
            </div>
          )}
          <button onClick={onStart} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow, sans-serif', marginBottom: 8 }}>▶ Start Trip</button>
          <button onClick={onIncident} style={{ width: '100%', padding: '9px', borderRadius: 9, background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', color: G.amber, fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow, sans-serif' }}>🚨 Report Incident</button>
        </div>
      </div>
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 8 }}>Recent Trips</div>
          {history.slice(0, 4).map(t => <HistRow key={t.id} trip={t} />)}
        </div>
      )}
    </div>
  );
}

function HistRow({ trip }: { trip: TripSummaryResponse }) {
  const c = ({ Completed: G.green, InProgress: G.lime, Cancelled: G.danger, Scheduled: G.warning } as any)[trip.status] ?? G.muted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: G.card, borderRadius: 7, border: `1px solid ${G.border}`, marginBottom: 5 }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G.lime }}>{trip.routeCode}</span>
            <span style={{ fontSize: 10, color: G.text }}>{trip.routeName}</span>
          </div>
          <div style={{ fontSize: 9, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>
            {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: c, background: `${c}15`, padding: '1px 5px', borderRadius: 3 }}>{trip.status}</div>
    </div>
  );
}

function MiniBox({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div style={{ flex: 1, padding: '7px 9px', background: '#0a1209', borderRadius: 7, border: `1px solid ${G.border}` }}>
      <div style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: G.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: mono ? 'JetBrains Mono, monospace' : 'Barlow, sans-serif', color: accent ?? G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: '14px 14px 0 0', overflow: 'hidden', width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', animation: 'modalIn .2s ease' }}>
        {children}
      </div>
    </div>
  );
}
function MH({ title, onClose }: { title: string; onClose: () => void }) {
  return <div style={{ padding: '13px 16px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h2 style={{ fontSize: 14, fontWeight: 700, color: G.text }}>{title}</h2><button onClick={onClose} style={{ background: 'none', border: 'none', color: G.muted, fontSize: 20, cursor: 'pointer' }}>×</button></div>;
}
function MF({ onClose, loading, label, color, dark, disabled, onSubmit }: any) {
  return (
    <div style={{ padding: '10px 16px 24px', borderTop: `1px solid ${G.border}`, display: 'flex', gap: 8 }}>
      <button onClick={onClose} style={{ ...inp, width: 'auto', padding: '10px 14px', cursor: 'pointer', color: G.muted }}>Back</button>
      <button onClick={onSubmit} disabled={loading || disabled} style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: color, color: dark ? '#000' : '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: loading || disabled ? .5 : 1, fontFamily: 'Barlow, sans-serif' }}>
        {loading ? 'Please wait...' : label}
      </button>
    </div>
  );
}
function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.8px', color: G.muted, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function StartModal({ shift, onClose, onSubmit, loading }: any) {
  const [pax, setPax] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Overlay onClose={onClose}>
      <MH title="Start Trip" onClose={onClose} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ padding: '10px 12px', background: '#0a1209', borderRadius: 8, border: `1px solid ${G.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: G.lime }}>{shift.assignedVehiclePlate}</div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>[{shift.assignedRouteCode}] {shift.assignedRouteName}</div>
          <div style={{ fontSize: 10, color: G.muted, marginTop: 1 }}>{shift.assignedRouteOrigin} → {shift.assignedRouteDestination}</div>
          {shift.conductorName && <div style={{ fontSize: 10, color: G.muted, marginTop: 1 }}>Conductor: {shift.conductorName}</div>}
        </div>
        <FG label="Initial Passengers"><input type="number" min="0" max="100" style={inp} value={pax} onChange={e => setPax(e.target.value)} placeholder="0" /></FG>
        <FG label="Notes (optional)"><textarea style={{ ...inp, height: 52, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Departure notes..." /></FG>
      </div>
      <MF onClose={onClose} loading={loading} label="▶ Start Trip" color="#22c55e" dark onSubmit={() => onSubmit({ initialPassengerCount: parseInt(pax) || 0, notes })} />
    </Overlay>
  );
}

function EndModal({ trip, elapsed, onClose, onSubmit, loading }: any) {
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Overlay onClose={onClose}>
      <MH title="End Trip" onClose={onClose} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px', background: 'rgba(34,197,94,.06)', borderRadius: 8, border: '1px solid rgba(34,197,94,.2)', marginBottom: 14 }}>
          <div><div style={{ fontSize: 7, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>Duration</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: G.lime }}>{elapsed}</div></div>
          <div><div style={{ fontSize: 7, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>Route</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: G.green }}>{trip.routeCode}</div></div>
          <div><div style={{ fontSize: 7, color: G.muted, fontFamily: 'JetBrains Mono, monospace' }}>Peak</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: G.warning }}>{trip.peakPassengerCount ?? 0}</div></div>
        </div>
        <FG label="Final Passenger Count *"><input type="number" min="0" max="200" required style={inp} value={count} onChange={e => setCount(e.target.value)} placeholder="Passengers at journey end" autoFocus /></FG>
        <FG label="Notes"><textarea style={{ ...inp, height: 52, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." /></FG>
      </div>
      <MF onClose={onClose} loading={loading} label="✓ Complete Trip" color="#22c55e" dark disabled={!count} onSubmit={() => onSubmit({ count: parseInt(count) || 0, notes })} />
    </Overlay>
  );
}

function CancelModal({ trip, onClose, onConfirm, loading }: any) {
  const [reason, setReason] = useState('');
  return (
    <Overlay onClose={onClose}>
      <MH title="Cancel Trip?" onClose={onClose} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', marginBottom: 12, fontSize: 11, color: '#f87171' }}>
          Cancel trip [{trip.routeCode}]? Reason required.
        </div>
        <FG label="Reason *"><textarea style={{ ...inp, height: 72, resize: 'none' }} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Vehicle breakdown..." autoFocus /></FG>
      </div>
      <MF onClose={onClose} loading={loading} label="Cancel Trip" color="#ef4444" dark={false} disabled={!reason.trim()} onSubmit={() => onConfirm(reason)} />
    </Overlay>
  );
}

function IncidentModal({ onClose, onSubmit, loading }: any) {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <Overlay onClose={onClose}>
      <MH title="Report Incident" onClose={onClose} />
      <div style={{ padding: '14px 16px' }}>
        <FG label="Incident Type *">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {INCIDENT_TYPES.map(it => (
              <button key={it.value} onClick={() => setType(it.value)} style={{ padding: '9px 7px', borderRadius: 8, cursor: 'pointer', border: `2px solid ${type === it.value ? it.color : G.border}`, background: type === it.value ? `${it.color}15` : 'transparent', color: type === it.value ? it.color : G.muted, fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: type === it.value ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 18 }}>{it.icon}</span>{it.label}
              </button>
            ))}
          </div>
        </FG>
        <FG label="Description *"><textarea style={{ ...inp, height: 72, resize: 'none' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What happened?" /></FG>
      </div>
      <MF onClose={onClose} loading={loading} label="🚨 Report" color="#f97316" dark={false} disabled={!type || !desc.trim()} onSubmit={() => onSubmit(type, desc)} />
    </Overlay>
  );
}