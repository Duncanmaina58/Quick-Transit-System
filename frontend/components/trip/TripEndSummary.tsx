'use client'

import { Clock, Navigation, Users, TrendingUp, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripEndSummaryProps {
  onComplete: () => void
}

export function TripEndSummary({ onComplete }: TripEndSummaryProps) {
  const tripData = {
    route: 'Route 42 - CBD to Westlands',
    duration: '47 minutes',
    distance: '15.2 km',
    passengers: '14',
    revenue: 'KES 2,100',
    safetyScore: '98%',
    violations: 0,
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-accent-foreground" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">Trip Completed</h1>
        <p className="text-muted-foreground text-sm mt-2 text-center">{tripData.route}</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-foreground font-bold text-lg">{tripData.duration}</p>
            <p className="text-muted-foreground text-xs mt-1">Duration</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Navigation className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-foreground font-bold text-lg">{tripData.distance}</p>
            <p className="text-muted-foreground text-xs mt-1">Distance</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Users className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-foreground font-bold text-lg">{tripData.passengers}</p>
            <p className="text-muted-foreground text-xs mt-1">Passengers</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-foreground font-bold text-lg">{tripData.revenue}</p>
            <p className="text-muted-foreground text-xs mt-1">Revenue</p>
          </div>
        </div>

        {/* Performance Section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Safety Score</p>
                <p className="text-foreground font-semibold text-lg mt-1">{tripData.safetyScore}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center border-2 border-success">
                <span className="text-success font-bold text-xl">98</span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Violations</span>
              <span className="text-success font-medium">{tripData.violations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Speed</span>
              <span className="text-foreground font-medium">19.4 km/h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fuel Efficiency</span>
              <span className="text-foreground font-medium">5.2 L/100km</span>
            </div>
          </div>
        </div>

        {/* Trip Timeline */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Trip Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">14:30 - Trip Started</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">14:52 - Pause (3 min break)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">15:17 - Trip Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border-t border-border p-4">
        <Button
          onClick={onComplete}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
