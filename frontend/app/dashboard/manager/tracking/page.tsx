'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationApi } from '@/lib/api/location';
import { useGoogleMaps,  } from '@/lib/hooks/useGoogleMaps';
import type { VehicleLocationResponse } from '@/types/api';
import type { LiveVehicleResponse } from '@/types/api';
const T = {
  bg: '#0d1b2a', surface: '#0a1628', card: '#0f2033',
  border: '#1e3a5f', teal: '#0891b2', text: '#e2eaf3',
  muted: '#5b7fa0', success: '#10b981', warning: '#f59e0b',
  danger: '#ef4444', cyan: '#06b6d4', purple: '#8b5cf6',
};

export default function ManagerTrackingPage() {
  const { loaded: mapsReady, error } = useGoogleMaps(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!
);
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapObj    = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [selected, setSelected] =
  useState<LiveVehicleResponse | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Poll active vehicle locations ─────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['active-locations'],
    queryFn: async () => {
  const r = await locationApi.getLiveFleet();
  setLastRefresh(new Date());
  return r;
},
    refetchInterval: 10000, // refresh every 10 seconds
  });
  const vehicles: LiveVehicleResponse[] =
  data?.data?.data ?? [];

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapObj.current) return;
    mapObj.current = new google.maps.Map(mapRef.current, {
      center:            { lat: -1.2921, lng: 36.8219 }, // Nairobi
      zoom:              12,
    //   styles:            MANAGER_MAP_STYLE,
      disableDefaultUI:  true,
      zoomControl:       true,
      zoomControlOptions:{ position: google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling:   'greedy',
      mapTypeControl:    false,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
  }, [mapsReady]);

  // ── Update markers when vehicles change ───────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapObj.current || !vehicles.length) return;

    const currentIds = new Set(vehicles.map(v => v.tripId));

    // Remove markers for trips that ended
    markersRef.current.forEach((marker, tripId) => {
      if (!currentIds.has(tripId)) {
        marker.setMap(null);
        markersRef.current.delete(tripId);
      }
    });

    // Add or update markers
    vehicles.forEach(vehicle => {
      const pos    = { lat: Number(vehicle.latitude), lng: Number(vehicle.longitude) };
      const color  = vehicle.isOverloaded ? '#ef4444' : vehicle.currentPassengers > vehicle.vehicleCapacity * 0.8 ? '#f59e0b' : '#0891b2';
      const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(busMarkerSvg(color, vehicle.registrationPlate, vehicle.heading ?? undefined));

      if (markersRef.current.has(vehicle.tripId)) {
        const marker = markersRef.current.get(vehicle.tripId)!;
        marker.setPosition(pos);
        marker.setIcon({ url: svgUrl, anchor: new google.maps.Point(28, 28) });
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          map:      mapObj.current!,
          icon:     { url: svgUrl, anchor: new google.maps.Point(28, 28) },
          title:    vehicle.registrationPlate,
          animation: google.maps.Animation.DROP,
        });

        marker.addListener('click', () => {
          setSelected(vehicle);
          // Show info window
          if (infoWindowRef.current && mapObj.current) {
            infoWindowRef.current.setContent(buildInfoWindowContent(vehicle));
            infoWindowRef.current.open(mapObj.current, marker);
          }
        });

        markersRef.current.set(vehicle.tripId, marker);
      }
    });

    // Auto-fit if first load
    if (vehicles.length > 0 && markersRef.current.size > 0) {
      const bounds = new google.maps.LatLngBounds();
      vehicles.forEach(v => bounds.extend({ lat: Number(v.latitude), lng: Number(v.longitude) }));
      // Only auto-fit if no vehicle is selected (avoids jarring pan during inspection)
      if (!selected) {
        mapObj.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        if (vehicles.length === 1) mapObj.current.setZoom(14);
      }
    }
  }, [mapsReady, vehicles]);

  const activeCount   = vehicles.length;
  const overloaded    = vehicles.filter(v => v.isOverloaded).length;
  const avgSpeed      = vehicles.filter(v => v.speed != null).reduce((s, v) => s + (v.speed ?? 0), 0) / Math.max(vehicles.filter(v => v.speed != null).length, 1);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes fadeIn{ from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        .vrow:hover { background: rgba(8,145,178,.06) !important; cursor: pointer; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-.3px' }}>Fleet Tracking</h1>
          <p style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted }}>
            Live · refreshes every 10s · last: {lastRefresh.toLocaleTimeString('en-KE', { timeStyle: 'short' })}
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <StatChip label="Active" value={activeCount} color={T.teal} />
          <StatChip label="Overloaded" value={overloaded} color={overloaded > 0 ? T.danger : T.muted} />
          <StatChip label="Avg Speed" value={`${Math.round(avgSpeed)} km/h`} color={T.cyan} />

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isLoading ? T.warning : T.success, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: isLoading ? T.warning : T.success, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isLoading ? 'Refreshing' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout: Map + Side panel ────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

       {/* ── Map ──────────────────────────────────────────────────────── */}
<div style={{ flex: 1, position: 'relative', background: '#0d1b2a' }}>
  {/* Google Maps container */}
  <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

  {/* Loading state */}
  {!mapsReady && (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1b2a', zIndex: 5 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.teal, animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
        <div style={{ fontSize: 11, color: T.muted, fontFamily: 'IBM Plex Mono' }}>Loading map...</div>
      </div>
    </div>
  )}

  {/* Empty state overlay */}
  {mapsReady && !isLoading && vehicles.length === 0 && (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      pointerEvents: 'none'
    }}>
      <div style={{
        background: 'rgba(13,27,42,.9)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: '24px 32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🚌</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>No Active Trips</div>
        <div style={{ fontSize: 11, color: T.muted }}>Vehicles will appear here once drivers start trips</div>
      </div>
    </div>
  )}

  {/* Map legend */}
  <div style={{ position: 'absolute', bottom: 20, left: 16, zIndex: 5, background: 'rgba(13,27,42,.9)', backdropFilter: 'blur(8px)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
    <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 6, letterSpacing: '1px' }}>Legend</div>
    {[
      { color: '#0891b2', label: 'Normal' },
      { color: '#f59e0b', label: 'Near capacity (>80%)' },
      { color: '#ef4444', label: 'Overloaded' },
    ].map(l => (
      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: T.muted }}>{l.label}</span>
      </div>
    ))}
  </div>
</div>

        {/* ── Side panel ───────────────────────────────────────────────── */}
        <div style={{ width: 320, background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Vehicle detail (when selected) */}
          {selected && (
            <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '14px 16px', animation: 'fadeIn .2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: selected.isOverloaded ? T.danger : T.success, animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 700, color: T.teal }}>{selected.registrationPlate}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>

              {/* Route */}
              <div style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T.teal, background: 'rgba(8,145,178,.1)', padding: '1px 6px', borderRadius: 4 }}>{selected.routeCode}</span>
                  <span style={{ fontSize: 11, color: T.text }}>{selected.routeName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.muted }}>
                  <span>{selected.origin}</span>
                  <span style={{ color: T.border }}>→</span>
                  <span>{selected.destination}</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
                <DetailBox label="Elapsed"    value={selected.elapsedTime} mono />
                <DetailBox label="Speed"      value={selected.speed != null ? `${Math.round(Number(selected.speed))} km/h` : '—'} mono />
                <DetailBox label="Passengers" value={`${selected.currentPassengers}/${selected.vehicleCapacity}`} accent={selected.isOverloaded ? T.danger : T.success} mono />
                <DetailBox label="Status"     value={selected.tripStatus} accent={T.teal} />
              </div>

              {/* Passengers bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontFamily: 'IBM Plex Mono', color: T.muted, marginBottom: 3 }}>
                  <span>Load</span>
                  <span>{Math.round((selected.currentPassengers / selected.vehicleCapacity) * 100)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (selected.currentPassengers / selected.vehicleCapacity) * 100)}%`, background: selected.isOverloaded ? T.danger : selected.currentPassengers / selected.vehicleCapacity > 0.8 ? T.warning : T.teal, borderRadius: 3, transition: 'width .3s' }} />
                </div>
              </div>

              {/* Crew */}
              <div style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 5 }}>Crew</div>
                <div style={{ fontSize: 11, color: T.text, marginBottom: 2 }}>🧑‍✈️ {selected.driverName}</div>
                {selected.conductorName && <div style={{ fontSize: 11, color: T.text }}>🎫 {selected.conductorName}</div>}
              </div>

              {/* Last update */}
              <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted, textAlign: 'right' }}>
                Last update: {new Date(selected.lastUpdated).toLocaleTimeString('en-KE', { timeStyle: 'short' })}
              </div>
            </div>
          )}

          {/* Vehicles list */}
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, letterSpacing: '1px', marginBottom: 10 }}>
              Active Vehicles ({activeCount})
            </div>

            {isLoading && vehicles.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.teal, animation: 'spin .7s linear infinite', margin: '0 auto' }} />
              </div>
            )}

            {!isLoading && vehicles.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', background: T.card, borderRadius: 9, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: 'IBM Plex Mono' }}>No active trips right now</div>
              </div>
            )}

            {vehicles.map(v => (
              <VehicleRow
                key={v.tripId}
                vehicle={v}
                selected={selected?.tripId === v.tripId}
                onClick={() => {
                  setSelected(v);
                  // Pan map to this vehicle
                  if (mapObj.current) {
                    mapObj.current.panTo({ lat: Number(v.latitude), lng: Number(v.longitude) });
                    mapObj.current.setZoom(14);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vehicle Row ───────────────────────────────────────────────────────────────
function VehicleRow({ vehicle, selected, onClick }: {
  vehicle: LiveVehicleResponse;
  selected: boolean;
  onClick: () => void;
}) {
  const loadPct  = Math.min(100, Math.round((vehicle.currentPassengers / vehicle.vehicleCapacity) * 100));
  const barColor = vehicle.isOverloaded ? T.danger : loadPct > 80 ? T.warning : T.teal;

  return (
    <div
      className="vrow"
      onClick={onClick}
      style={{
        padding: '10px 12px', borderRadius: 10, marginBottom: 7,
        background: selected ? 'rgba(8,145,178,.1)' : T.card,
        border: `1px solid ${selected ? T.teal : T.border}`,
        transition: 'all .12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: vehicle.isOverloaded ? T.danger : T.success, animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700, color: T.teal }}>{vehicle.registrationPlate}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: T.teal, background: 'rgba(8,145,178,.1)', padding: '1px 5px', borderRadius: 4 }}>{vehicle.routeCode}</span>
        </div>
        <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted }}>{vehicle.elapsedTime}</span>
      </div>

      <div style={{ fontSize: 10, color: T.muted, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {vehicle.driverName}{vehicle.conductorName ? ` · ${vehicle.conductorName}` : ''}
      </div>

      {/* Load bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${loadPct}%`, background: barColor, borderRadius: 3, transition: 'width .5s' }} />
        </div>
        <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: barColor, flexShrink: 0 }}>
          {vehicle.currentPassengers}/{vehicle.vehicleCapacity}
        </span>
        {vehicle.speed != null && (
          <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted, flexShrink: 0 }}>
            {Math.round(Number(vehicle.speed))}km/h
          </span>
        )}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'IBM Plex Mono', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, letterSpacing: '1px', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DetailBox({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div style={{ padding: '7px 9px', background: '#0a1628', borderRadius: 6, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 7, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: mono ? 'IBM Plex Mono' : 'IBM Plex Sans, sans-serif', color: accent ?? T.text }}>{value}</div>
    </div>
  );
}

function buildInfoWindowContent(v: LiveVehicleResponse): string {
  const loadPct = Math.min(100, Math.round((v.currentPassengers / v.vehicleCapacity) * 100));
  return `
    <div style="font-family:'IBM Plex Sans',sans-serif;padding:8px;min-width:180px;background:#0f2033;color:#e2eaf3;border-radius:8px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:#0891b2;margin-bottom:4px">${v.registrationPlate}</div>
      <div style="font-size:10px;color:#5b7fa0;margin-bottom:6px">[${v.routeCode}] ${v.routeName}</div>
      <div style="font-size:11px;margin-bottom:4px">👤 ${v.driverName}</div>
      <div style="font-size:11px;margin-bottom:6px">🚌 ${v.currentPassengers}/${v.vehicleCapacity} pax (${loadPct}%)</div>
      ${v.speed != null ? `<div style="font-size:10px;color:#5b7fa0">Speed: ${Math.round(Number(v.speed))} km/h</div>` : ''}
      <div style="font-size:9px;color:#5b7fa0;margin-top:4px">${v.elapsedTime} elapsed</div>
    </div>
  `;
}

function busMarkerSvg(color: string, registrationPlate: string, arg2: number | undefined): string | number | boolean {
  throw new Error('Function not implemented.');
}
