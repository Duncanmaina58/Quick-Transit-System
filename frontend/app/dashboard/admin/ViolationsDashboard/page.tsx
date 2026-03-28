'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  TrendingDown,
  BarChart3,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Violation {
  id: string
  vehicle: string
  driver: string
  date: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  location: string
  status: 'open' | 'acknowledged' | 'resolved'
  sla: string
}

const violations: Violation[] = [
  {
    id: 'V-001',
    vehicle: 'QT-002',
    driver: 'Sarah Johnson',
    date: '2024-02-03 14:30',
    type: 'Speeding (85 km/h in 60 zone)',
    severity: 'high',
    location: 'Highway 101',
    status: 'open',
    sla: '2h 15m',
  },
  {
    id: 'V-002',
    vehicle: 'QT-005',
    driver: 'David Brown',
    date: '2024-02-03 12:15',
    type: 'Route Deviation',
    severity: 'medium',
    location: 'Downtown Area',
    status: 'acknowledged',
    sla: '4h 45m',
  },
  {
    id: 'V-003',
    vehicle: 'QT-001',
    driver: 'John Smith',
    date: '2024-02-02 16:45',
    type: 'Late Arrival (5 min)',
    severity: 'low',
    location: 'Central Station',
    status: 'resolved',
    sla: '24h',
  },
  {
    id: 'V-004',
    vehicle: 'QT-003',
    driver: 'Mike Davis',
    date: '2024-02-02 10:20',
    type: 'Harsh Braking',
    severity: 'medium',
    location: 'Residential Zone',
    status: 'resolved',
    sla: '18h 40m',
  },
]

const violationStats = [
  { name: 'Speeding', value: 45 },
  { name: 'Harsh Braking', value: 28 },
  { name: 'Route Deviation', value: 18 },
  { name: 'Late Arrival', value: 9 },
]

const violationTrend = [
  { date: 'Mon', violations: 12 },
  { date: 'Tue', violations: 15 },
  { date: 'Wed', violations: 10 },
  { date: 'Thu', violations: 18 },
  { date: 'Fri', violations: 8 },
  { date: 'Sat', violations: 5 },
  { date: 'Sun', violations: 3 },
]

const colors = {
  critical: 'hsl(0, 84%, 60%)',
  high: 'hsl(30, 80%, 55%)',
  medium: 'hsl(40, 90%, 50%)',
  low: 'hsl(175, 70%, 45%)',
}

export default function ViolationsDashboard() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = violations.filter(
    (v) =>
      (search === '' ||
        v.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        v.driver.toLowerCase().includes(search.toLowerCase())) &&
      (severityFilter === null || v.severity === severityFilter) &&
      (statusFilter === null || v.status === statusFilter)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety & Violations</h1>
          <p className="text-muted-foreground mt-1">
            {violations.filter((v) => v.status === 'open').length} open violations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Violations</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {violations.length}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-500">-15% from last week</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            {violations.filter((v) => v.status === 'open').length}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Require action</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            12.5h
          </p>
          <p className="text-xs text-muted-foreground mt-2">Within SLA</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
          <p className="text-3xl font-bold text-green-500 mt-2">
            94%
          </p>
          <p className="text-xs text-muted-foreground mt-2">Fleet average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation Types */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Violation Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={violationStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {violationStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 0
                        ? colors.high
                        : index === 1
                          ? colors.medium
                          : index === 2
                            ? colors.medium
                            : colors.low
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 10%)',
                  border: '1px solid hsl(0, 0%, 20%)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Trend */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={violationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
              <XAxis dataKey="date" stroke="hsl(0, 0%, 60%)" />
              <YAxis stroke="hsl(0, 0%, 60%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 10%)',
                  border: '1px solid hsl(0, 0%, 20%)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="violations" fill={colors.high} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Violations List */}
      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by vehicle or driver..."
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

        {/* Severity Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSeverityFilter(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              severityFilter === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {['critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                severityFilter === sev
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filters */}
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
            All
          </button>
          {['open', 'acknowledged', 'resolved'].map((status) => (
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
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Violations Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Location
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((violation) => (
              <tr
                key={violation.id}
                className="border-b border-border hover:bg-secondary/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{violation.vehicle}</p>
                    <p className="text-xs text-muted-foreground">{violation.driver}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{violation.type}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">{violation.location}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {violation.severity === 'critical' && (
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    )}
                    {violation.severity === 'high' && (
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                    )}
                    {violation.severity === 'medium' && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    )}
                    {violation.severity === 'low' && (
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    )}
                    <span className="text-sm capitalize text-foreground">
                      {violation.severity}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {violation.status === 'open' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                      Open
                    </span>
                  )}
                  {violation.status === 'acknowledged' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                      Acknowledged
                    </span>
                  )}
                  {violation.status === 'resolved' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                      Resolved
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{violation.date}</td>
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
    </div>
  )
}
