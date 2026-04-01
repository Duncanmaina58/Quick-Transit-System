/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ─────────────────────────────────────────────────────────────────────────────
// lib/hooks/useGoogleMaps.ts
// Loads the Google Maps JS API via script tag, returns loaded state
// Usage: const { loaded } = useGoogleMaps(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!)
// ─────────────────────────────────────────────────────────────────────────────
import {  useState } from 'react';

const SCRIPT_ID = 'qt-google-maps-script';

export function useGoogleMaps(apiKey: string) {
  const [loaded, setLoaded]   = useState(false);
  const [error,  setError]    = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already loaded
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }

    // Script already injected — poll until ready
    if (document.getElementById(SCRIPT_ID)) {
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          setLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script    = document.createElement('script');
    script.id       = SCRIPT_ID;
    script.src      = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async    = true;
    script.defer    = true;
    script.onload   = () => setLoaded(true);
    script.onerror  = () => setError('Failed to load Google Maps. Check your API key.');
    document.head.appendChild(script);
  }, [apiKey]);

  return { loaded, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// lib/hooks/useWatchPosition.ts
// Wraps navigator.geolocation.watchPosition for live driver GPS
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';

export interface GpsPosition {
  lat:      number;
  lng:      number;
  speed:    number | null;   // km/h
  heading:  number | null;   // degrees
  accuracy: number;          // metres
}




export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a1209' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1209' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4d7a52' }] },

  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a3320' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#84cc16' }],
  },

  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#020617' }],
  },
];

export function useWatchPosition(
  onPosition: (pos: GpsPosition) => void,
  enabled: boolean
) {
  const callbackRef = useRef(onPosition);
  callbackRef.current = onPosition;

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('[QuickTransit] Geolocation not available');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (raw) => {
        callbackRef.current({
          lat:      raw.coords.latitude,
          lng:      raw.coords.longitude,
          speed:    raw.coords.speed != null ? raw.coords.speed * 3.6 : null,
          heading:  raw.coords.heading,
          accuracy: raw.coords.accuracy,
        });
      },
      (err) => console.warn('[QuickTransit] GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);
}