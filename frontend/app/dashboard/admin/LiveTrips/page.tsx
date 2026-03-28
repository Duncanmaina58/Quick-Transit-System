'use client'

import { useState } from 'react'
import { Search, Filter, AlertTriangle, CheckCircle, Clock, MapPin, Users, MoreVertical, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LiveTrip {
  id: string
  vehicle: string
  driver: string
  route: string
  status: 'active' | 'completed' | 'paused' | 'delayed'
  passengers: number
  capacity: number
  progress: number
  location: string
  eta: string
  nextStop: string
  violations: number
  lastUpdate: string
}

const liveTrips: LiveTrip[] = [
  {
    id: 'T-001',
    vehicle: 'QT-001',
    driver: 'John Smith',
    route: 'Route A1',
    status: 'active',
    passengers: 42,
    capacity: 50,
    progress: 65,
    location: 'Downtown Station',
    eta: '12:45',
    nextStop: 'Central Park',
    violations: 0,
    lastUpdate: '2m ago',
  },
  {
    id: 'T-002',
    vehicle: 'QT-002',
    driver: 'Sarah Johnson',
    route: 'Route A2',
    status: 'active',
    passengers: 38,
    capacity: 50,
    progress: 42,
    location: 'Shopping District',
    eta: '12:50',
    nextStop: 'West Terminal',
    violations: 1,
    lastUpdate: '1m ago',
  },
  {
    id: 'T-003',
    vehicle: 'QT-004',
    driver: 'Emma Wilson',
    route: 'Route A1',
    status: 'delayed',
    passengers: 45,
    capacity: 50,
    progress: 55,
    location: 'East Avenue',
    eta: '13:05',
    nextStop: 'Hospital Complex',
    violations: 0,
    lastUpdate: '3m ago',
  },
  {
    id: 'T-004',
    vehicle: 'QT-005',
    driver: 'David Brown',
    route: 'Route B1',
    status: 'active',
    passengers: 32,
    capacity: 45,
    progress: 78,
    location: 'Airport Road',
    eta: '12:35',
    nextStop: 'Terminal 2',
    violations: 0,
    lastUpdate: '1m ago',
  },
  {
    id: 'T-005',
    vehicle: 'QT-003',
    driver: 'Mike Davis',
    route: 'Route C1',
    status: 'completed',
    passengers: 0,
    capacity: 50,
    progress: 100,
    location: 'Central Depot',
    eta: 'Complete',
    nextStop: 'N/A',
    violations: 2,
    lastUpdate: '15m ago',
  },
]

export default function LiveTrips() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = liveTrips.filter(
    (trip) =>
      (search === '' ||
        trip.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        trip.driver.toLowerCase().includes(search.toLowerCase()) ||
        trip.route.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === null || trip.status === statusFilter)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Operations</h1>
          <p className="text-muted-foreground mt-1">
            {liveTrips.filter((t) => t.status === 'active').length} active trips
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
            Auto-refreshing
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by vehicle, driver or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter(null)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            statusFilter === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          All ({liveTrips.length})
        </button>
        {['active', 'delayed', 'paused', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {status} ({liveTrips.filter((t) => t.status === status).length})
          </button>
        ))}
      </div>

      {/* Trips Cards */}
      <div className="space-y-3">
        {filtered.map((trip) => (
          <div
            key={trip.id}
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Vehicle Info */}
                <div className="min-w-fit">
                  <p className="text-sm font-semibold text-foreground">{trip.vehicle}</p>
                  <p className="text-xs text-muted-foreground">{trip.id}</p>
                </div>

                {/* Driver & Route */}
                <div className="flex-1">
                  <p className="text-sm text-foreground">{trip.driver}</p>
                  <p className="text-xs text-muted-foreground">{trip.route}</p>
                </div>

                {/* Location & ETA */}
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{trip.location}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-foreground">{trip.eta}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 ml-4">
                {trip.status === 'active' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500 font-medium">Active</span>
                  </>
                )}
                {trip.status === 'delayed' && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">Delayed</span>
                  </>
                )}
                {trip.status === 'completed' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Completed</span>
                  </>
                )}
              </div>

              {/* Actions */}
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Route Progress</span>
                <span className="text-xs font-semibold text-foreground">{trip.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${trip.progress}%` }}
                />
              </div>
            </div>

            {/* Info Row */}
            <div className="flex items-center justify-between">
              {/* Passengers */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {trip.passengers}/{trip.capacity} passengers
                </span>
              </div>

              {/* Next Stop */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Next: {trip.nextStop}</span>
              </div>

              {/* Violations */}
              {trip.violations > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-500 font-medium">{trip.violations} violation(s)</span>
                </div>
              )}

              {/* Last Update */}
              <span className="text-xs text-muted-foreground ml-auto">{trip.lastUpdate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
