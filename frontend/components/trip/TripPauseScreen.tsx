'use client'

import { useState } from 'react'
import { AlertCircle, ChevronRight, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripPauseScreenProps {
  onResume: () => void
  onEnd: () => void
}

const pauseReasons = [
  { id: 'passenger-pickup', label: 'Passenger Pick-up', icon: '🚶' },
  { id: 'passenger-dropoff', label: 'Passenger Drop-off', icon: '🏃' },
  { id: 'break', label: 'Driver Break', icon: '☕' },
  { id: 'traffic', label: 'Traffic Jam', icon: '🚦' },
  { id: 'mechanical', label: 'Mechanical Issue', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '❓' },
]

export function TripPauseScreen({ onResume, onEnd }: TripPauseScreenProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground">Trip Paused</h1>
        <p className="text-muted-foreground text-sm mt-1">Elapsed: 12:34 • Distance: 4.8 km</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Pause Reason Selection */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Pause Reason</h3>
          <div className="grid grid-cols-2 gap-2">
            {pauseReasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-sm font-medium ${
                  selectedReason === reason.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-secondary/30 hover:border-border'
                }`}
              >
                <span className="text-lg">{reason.icon}</span>
                <span className="text-foreground text-xs text-center">{reason.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trip Stats While Paused */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Trip Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Elapsed</span>
              <span className="text-foreground font-medium">12:34</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance Covered</span>
              <span className="text-foreground font-medium">4.8 km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passengers Transported</span>
              <span className="text-foreground font-medium">8</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining Distance</span>
              <span className="text-foreground font-medium">10.4 km</span>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-warning font-medium text-sm">Trip Paused</p>
            <p className="text-warning/80 text-xs mt-1">Resume trip to continue logging time and distance</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border-t border-border p-4 space-y-2">
        <Button
          onClick={onResume}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Resume Trip
        </Button>
        <Button
          onClick={onEnd}
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10 font-semibold h-11 flex items-center justify-center gap-2 bg-transparent"
        >
          <X className="w-5 h-5" />
          End Trip
        </Button>
      </div>
    </div>
  )
}
