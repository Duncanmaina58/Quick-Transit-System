'use client'

import { MapPin, Users, Clock, AlertCircle, Navigation, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripInProgressScreenProps {
  onPause: () => void
  onEnd: () => void
}

export function TripInProgressScreen({ onPause, onEnd }: TripInProgressScreenProps) {
  const elapsedTime = '12:34'
  const distance = '4.8'
  const passengers = 8
  const nextStop = 'Kenyatta Avenue'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Live Map Section */}
      <div className="relative bg-secondary h-80 flex items-center justify-center border-b border-border overflow-hidden">
        <Navigation className="w-16 h-16 text-accent animate-pulse" />
        <div className="absolute top-4 left-4 right-4 bg-card border border-border rounded-lg p-3">
          <p className="text-foreground font-semibold text-sm">Route 42 - CBD to Westlands</p>
          <p className="text-muted-foreground text-xs mt-1">Live GPS Tracking</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-foreground font-bold text-lg">{elapsedTime}</p>
            <p className="text-muted-foreground text-xs mt-1">Elapsed</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <Navigation className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-foreground font-bold text-lg">{distance} km</p>
            <p className="text-muted-foreground text-xs mt-1">Distance</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <Users className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-foreground font-bold text-lg">{passengers}/14</p>
            <p className="text-muted-foreground text-xs mt-1">Passengers</p>
          </div>
        </div>

        {/* Next Stop */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex gap-3">
          <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Next Stop</p>
            <p className="text-foreground font-semibold text-sm mt-1">{nextStop}</p>
            <p className="text-muted-foreground text-xs mt-1">2.3 km away • 5 min</p>
          </div>
        </div>

        {/* Route Progress */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-foreground text-sm">Route Progress</h3>
            <span className="text-accent font-bold text-sm">32%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="bg-accent h-full w-1/3 transition-all" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Nairobi CBD</span>
            <span>Westlands</span>
          </div>
        </div>

        {/* Passenger Management */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Passenger Management</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-secondary h-10 bg-transparent"
            >
              - Pick Up
            </Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-10"
            >
              + Drop Off
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-warning font-medium text-sm">Minor Traffic</p>
            <p className="text-warning/80 text-xs mt-1">Heavy traffic detected on Kenyatta Avenue</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border-t border-border p-4 space-y-2">
        <Button
          onClick={onPause}
          className="w-full bg-warning hover:bg-warning/90 text-accent-foreground font-semibold h-11 flex items-center justify-center gap-2"
        >
          <Pause className="w-5 h-5" />
          Pause Trip
        </Button>
        <Button
          onClick={onEnd}
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10 font-semibold h-11 bg-transparent"
        >
          End Trip
        </Button>
      </div>
    </div>
  )
}
