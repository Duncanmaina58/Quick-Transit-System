'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: string
  plate: string
  make: string
  model: string
  year: number
  route: string
  driver: string
  status: 'active' | 'maintenance' | 'idle'
  utilization: number
  lastTrip: string
  violations: number
  riskScore: number
}

const vehicles: Vehicle[] = [
  {
    id: '1',
    plate: 'QT-001',
    make: 'Volvo',
    model: 'B11R',
    year: 2022,
    route: 'Route A1',
    driver: 'John Smith',
    status: 'active',
    utilization: 94,
    lastTrip: '2m ago',
    violations: 0,
    riskScore: 12,
  },
  {
    id: '2',
    plate: 'QT-002',
    make: 'Volvo',
    model: 'B11R',
    year: 2022,
    route: 'Route A2',
    driver: 'Sarah Johnson',
    status: 'active',
    utilization: 87,
    lastTrip: '5m ago',
    violations: 1,
    riskScore: 18,
  },
  {
    id: '3',
    plate: 'QT-003',
    make: 'MAN',
    model: 'Lion\'s City',
    year: 2021,
    route: 'Route B1',
    driver: 'Mike Davis',
    status: 'maintenance',
    utilization: 0,
    lastTrip: '2h ago',
    violations: 2,
    riskScore: 35,
  },
  {
    id: '4',
    plate: 'QT-004',
    make: 'Scania',
    model: 'OmniCity',
    year: 2023,
    route: 'Route C1',
    driver: 'Emma Wilson',
    status: 'active',
    utilization: 92,
    lastTrip: '1m ago',
    violations: 0,
    riskScore: 8,
  },
  {
    id: '5',
    plate: 'QT-005',
    make: 'Volvo',
    model: 'B11R',
    year: 2021,
    route: 'Route C2',
    driver: 'David Brown',
    status: 'idle',
    utilization: 45,
    lastTrip: '30m ago',
    violations: 3,
    riskScore: 42,
  },
]

export default function VehicleList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = vehicles.filter(
    (v) =>
      (search === '' ||
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.driver.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === null || v.status === statusFilter)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">256 vehicles in fleet</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by plate number or driver..."
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            statusFilter === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          All ({vehicles.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            statusFilter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Active ({vehicles.filter((v) => v.status === 'active').length})
        </button>
        <button
          onClick={() => setStatusFilter('maintenance')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            statusFilter === 'maintenance'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Maintenance ({vehicles.filter((v) => v.status === 'maintenance').length})
        </button>
        <button
          onClick={() => setStatusFilter('idle')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            statusFilter === 'idle'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Idle ({vehicles.filter((v) => v.status === 'idle').length})
        </button>
      </div>

      {/* Vehicle Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Route
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Utilization
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Last Trip
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vehicle, idx) => (
              <tr
                key={vehicle.id}
                className="border-b border-border hover:bg-secondary/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{vehicle.plate}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{vehicle.driver}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{vehicle.route}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {vehicle.status === 'active' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-500">Active</span>
                      </>
                    )}
                    {vehicle.status === 'maintenance' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm text-orange-500">Maintenance</span>
                      </>
                    )}
                    {vehicle.status === 'idle' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span className="text-sm text-muted-foreground">Idle</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${vehicle.utilization}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {vehicle.utilization}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {vehicle.riskScore > 30 && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    {vehicle.riskScore <= 30 && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      vehicle.riskScore > 30 ? 'text-orange-500' : 'text-green-500'
                    )}>
                      {vehicle.riskScore}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">{vehicle.lastTrip}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {vehicles.length} vehicles
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            Previous
          </Button>
          <Button variant="outline">1</Button>
          <Button variant="default" className="bg-primary text-primary-foreground">
            2
          </Button>
          <Button variant="outline">Next</Button>
        </div>
      </div>
    </div>
  )
}
