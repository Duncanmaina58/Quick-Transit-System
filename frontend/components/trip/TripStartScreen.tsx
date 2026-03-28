'use client'

import { MapPin, Users, Clock, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripStartScreenProps {
  onStart: () => void
  onCancel: () => void
}

export function TripStartScreen({ onStart, onCancel }: TripStartScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground">Start Trip</h1>
        <p className="text-muted-foreground text-sm mt-1">Trip: Route 42 - CBD to Westlands</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Route Preview Map Placeholder */}
        <div className="bg-secondary border border-border rounded-lg h-48 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-accent mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Map Preview</p>
            <p className="text-muted-foreground text-xs mt-1">15.2 km • 8 stops</p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Trip Time</p>
                <p className="text-foreground font-semibold text-sm mt-1">Est. 45 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Capacity</p>
                <p className="text-foreground font-semibold text-sm mt-1">0 / 14 passengers</p>
              </div>
            </div>
          </div>

          {/* Route Stops */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Route Stops</h3>
            <div className="space-y-2">
              {[
                { name: 'Nairobi CBD', time: '00:00' },
                { name: 'Kenyatta Avenue', time: '08:30' },
                { name: 'Westlands', time: '45:00' },
              ].map((stop, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground flex-1">{stop.name}</span>
                  <span className="text-muted-foreground text-xs">{stop.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-trip Checklist */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Pre-Trip Checklist</h3>
            <div className="space-y-2">
              {[
                { item: 'Vehicle condition checked', done: true },
                { item: 'Passengers manifesto updated', done: true },
                { item: 'GPS verified', done: true },
                { item: 'First aid kit present', done: true },
              ].map((check, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked={check.done}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <span className={check.done ? 'text-foreground' : 'text-muted-foreground'}>
                    {check.item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border-t border-border p-4 space-y-2">
        <Button
          onClick={onStart}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11"
        >
          Start Trip Now
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-secondary font-semibold h-11 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
