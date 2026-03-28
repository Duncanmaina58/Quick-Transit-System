'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api/manager';
import type { TripSummaryResponse, TripResponse, TripFilterRequest } from '@/types/api';

const T = {
  bg: '#0d1b2a', surface: '#0a1628', card: '#0f2033',
  border: '#1e3a5f', teal: '#0891b2',
  text: '#e2eaf3', muted: '#5b7fa0',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444', purple: '#8b5cf6',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  background: '#0a1628', border: '1px solid #1e3a5f',
  borderRadius: 7, color: '#e2eaf3',
  fontSize: 12.5, fontFamily: 'IBM Plex Sans, sans-serif', outline: 'none',
};

const STATUS_COLORS: Record<string, string> = {
  Completed:  '#10b981',
  InProgress: '#0891b2',
  Cancelled:  '#ef4444',
  Scheduled:  '#f59e0b',
};

export default function ManagerTripsPage() {
  const [filter, setFilter] = useState<TripFilterRequest>({ page: 1, pageSize: 20 });
  const [detail, setDetail] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['manager-trips', filter],
    queryFn: () => managerApi.getTrips(filter),
  });

  const { data: detailData } = useQuery({
    queryKey: ['trip-detail', detail],
    queryFn: () => detail ? managerApi.getTripById(detail) : Promise.resolve(null),
    enabled: !!detail,
  });

  const trips = data?.data?.data ?? [];
  const meta  = data?.data;
  const trip: TripResponse | null = detailData?.data?.data ?? null;

  const handleFilter = useCallback((k: keyof TripFilterRequest, v: any) => {
    setFilter(f => ({ ...f, [k]: v === '' ? undefined : v, page: 1 }));
  }, []);

  // Stats from current page
  const completed   = trips.filter((t: TripSummaryResponse) => t.status === 'Completed').length;
  const inProgress  = trips.filter((t: TripSummaryResponse) => t.status === 'InProgress').length;
  const cancelled   = trips.filter((t: TripSummaryResponse) => t.status === 'Cancelled').length;
  const totalPax    = trips.reduce((s: number, t: TripSummaryResponse) => s + (t.finalPassengerCount ?? 0), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1320 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        input:focus,select:focus{border-color:#0891b2!important;}
        .trow:hover td{background:rgba(8,145,178,.03);}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-.3px' }}>Trip Logs</h1>
        <p style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
          All trips for your SACCO · {meta?.totalCount ?? 0} records
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Completed',  value: completed,  color: T.success },
          { label: 'In Progress',value: inProgress, color: T.teal },
          { label: 'Cancelled',  value: cancelled,  color: T.danger },
          { label: 'Total Pax',  value: totalPax,   color: T.purple },
        ].map((s, i) => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', animation: `fadeUp .3s ease ${i*50}ms both` }}>
            <div style={{ height: 2, background: s.color, position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '10px 10px 0 0' }} />
            <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'IBM Plex Mono', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 380px' : '1fr', gap: 18 }}>

        {/* Table + filters */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '11px 13px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 14 }}>
            <select value={filter.status ?? ''} onChange={e => handleFilter('status', e.target.value)} style={{ ...inp, width: 140 }}>
              <option value="">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="InProgress">In Progress</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Scheduled">Scheduled</option>
            </select>
            <input type="date" value={filter.dateFrom ? filter.dateFrom.toString().slice(0,10) : ''} onChange={e => handleFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)} style={{ ...inp, width: 150 }} />
            <input type="date" value={filter.dateTo ? filter.dateTo.toString().slice(0,10) : ''} onChange={e => handleFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)} style={{ ...inp, width: 150 }} />
            <button onClick={() => setFilter({ page: 1, pageSize: 20 })} style={{ ...inp, width: 'auto', padding: '8px 12px', cursor: 'pointer', color: T.muted }}>Clear</button>
          </div>

          {/* Table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Vehicle', 'Route', 'Driver', 'Start', 'Duration', 'Pax', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '1px', color: T.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <div style={{ height: 11, borderRadius: 3, background: '#1e3a5f', width: [70, 60, 90, 80, 50, 40, 60][j], animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}</tr>
                  ))
                ) : trips.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: T.muted, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>No trips found</td></tr>
                ) : trips.map((t: TripSummaryResponse) => (
                  <tr
                    key={t.id}
                    className="trow"
                    onClick={() => setDetail(detail === t.id ? null : t.id)}
                    style={{ borderBottom: `1px solid rgba(30,58,95,.5)`, cursor: 'pointer', background: detail === t.id ? 'rgba(8,145,178,.06)' : 'transparent', transition: 'background .1s' }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.teal, fontWeight: 600 }}>{t.registrationPlate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T.teal, background: 'rgba(8,145,178,.1)', padding: '1px 6px', borderRadius: 4 }}>{t.routeCode}</span>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{t.routeName}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: T.text }}>{t.driverName}</td>
                    <td style={{ padding: '10px 14px', fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>
                      {t.actualStartTime ? new Date(t.actualStartTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.muted }}>
                      {t.durationMinutes ? `${Math.round(t.durationMinutes)} min` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 700, color: T.purple }}>
                      {t.finalPassengerCount ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}><StatusChip status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && meta.totalPages > 1 && (
              <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: T.muted }}>Page {meta.page} / {meta.totalPages} · {meta.totalCount} trips</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Pag label="← Prev" disabled={!meta.hasPrevious} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
                  <Pag label="Next →" disabled={!meta.hasNext}     onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {detail && trip && (
          <TripDetailPanel trip={trip} onClose={() => setDetail(null)} />
        )}
      </div>
    </div>
  );
}

// ── Trip Detail Panel ─────────────────────────────────────────────────────────
function TripDetailPanel({ trip, onClose }: { trip: TripResponse; onClose: () => void }) {
  const c = STATUS_COLORS[trip.status] ?? '#64748b';

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, overflow: 'hidden',
      animation: 'slideIn .2s ease',
      position: 'sticky', top: 28,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${c}0a` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, animation: trip.status === 'InProgress' ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{trip.registrationPlate}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: T.teal, background: 'rgba(8,145,178,.1)', padding: '1px 6px', borderRadius: 4 }}>{trip.routeCode}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ padding: '14px 16px', maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Route path */}
        <div style={{ padding: '10px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.success }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{trip.origin}</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{trip.destination}</span>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.danger }} />
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>{trip.routeName}</div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Start Time',   value: trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
            { label: 'End Time',     value: trip.actualEndTime ? new Date(trip.actualEndTime).toLocaleTimeString('en-KE', { timeStyle: 'short' }) : '—' },
            { label: 'Duration',     value: trip.durationMinutes ? `${Math.round(trip.durationMinutes)} min` : '—' },
            { label: 'Init. Pax',    value: String(trip.initialPassengerCount ?? 0) },
            { label: 'Final Pax',    value: trip.finalPassengerCount != null ? String(trip.finalPassengerCount) : '—' },
            { label: 'Peak Pax',     value: trip.peakPassengerCount != null ? String(trip.peakPassengerCount) : '—' },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 10px', background: T.surface, borderRadius: 7, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: T.text }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Crew */}
        <div style={{ padding: '10px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Crew</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: 'IBM Plex Mono' }}>Driver</div>
              <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{trip.driverName}</div>
              <div style={{ fontSize: 9, color: T.teal, fontFamily: 'IBM Plex Mono' }}>{trip.driverEmployeeId}</div>
            </div>
            {trip.conductorName && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: 'IBM Plex Mono' }}>Conductor</div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{trip.conductorName}</div>
              </div>
            )}
          </div>
        </div>

        {/* Passenger logs */}
        {trip.passengerLogs.length > 0 && (
          <div>
            <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, letterSpacing: '1px', marginBottom: 8 }}>Passenger Log ({trip.passengerLogs.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {trip.passengerLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: T.surface, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: T.muted }}>
                      {new Date(log.logTime).toLocaleTimeString('en-KE', { timeStyle: 'short' })}
                      {log.stopName && ` · ${log.stopName}`}
                    </div>
                    <div style={{ fontSize: 9, color: T.teal, fontFamily: 'IBM Plex Mono', marginTop: 1 }}>{log.logType}</div>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, fontWeight: 700, color: T.text }}>{log.passengerCount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {trip.notes && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>Notes</div>
            <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{trip.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? '#64748b';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 20, fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '.5px', background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {status}
    </span>
  );
}

function Pag({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: `1px solid ${T.border}`, color: disabled ? T.muted : T.text, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1 }}>{label}</button>;
}