'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Download, Filter, Calendar } from 'lucide-react'

const performanceData = [
  { date: 'Week 1', trips: 420, revenue: 8400, efficiency: 92 },
  { date: 'Week 2', trips: 450, revenue: 9100, efficiency: 94 },
  { date: 'Week 3', trips: 380, revenue: 7800, efficiency: 88 },
  { date: 'Week 4', trips: 510, revenue: 9200, efficiency: 96 },
]

const routeEfficiency = [
  { route: 'Route A1', efficiency: 94, violations: 2, passengers: 3240 },
  { route: 'Route A2', efficiency: 91, violations: 3, passengers: 2180 },
  { route: 'Route B1', efficiency: 88, violations: 5, passengers: 1450 },
  { route: 'Route B2', efficiency: 85, violations: 6, passengers: 1890 },
  { route: 'Route C1', efficiency: 92, violations: 1, passengers: 2560 },
]

const crewPerformance = [
  { crew: 'John Smith', score: 94, trips: 45, violations: 0 },
  { crew: 'Sarah Johnson', score: 91, trips: 42, violations: 2 },
  { crew: 'Emma Wilson', score: 96, trips: 48, violations: 0 },
  { crew: 'David Brown', score: 88, trips: 40, violations: 3 },
  { crew: 'Lisa Anderson', score: 78, trips: 35, violations: 5 },
]

export default function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState('week')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive fleet performance and operational insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Calendar className="w-4 h-4" />
            Select Range
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        {['day', 'week', 'month', 'quarter', 'year'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
          <p className="text-3xl font-bold text-foreground mt-2">1,760</p>
          <p className="text-xs text-green-500 mt-2">+12% vs last period</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground mt-2">$34,500</p>
          <p className="text-xs text-green-500 mt-2">+8% vs last period</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Avg Efficiency</p>
          <p className="text-3xl font-bold text-foreground mt-2">92.5%</p>
          <p className="text-xs text-green-500 mt-2">+2% vs baseline</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Passengers</p>
          <p className="text-3xl font-bold text-foreground mt-2">42.5K</p>
          <p className="text-xs text-green-500 mt-2">+15% vs last period</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={performanceData}>
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
              <Legend />
              <Bar dataKey="trips" fill="hsl(215, 100%, 55%)" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="efficiency" stroke="hsl(175, 70%, 45%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 100%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215, 100%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(215, 100%, 55%)"
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Efficiency */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Route Efficiency Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={routeEfficiency}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
            <XAxis dataKey="route" stroke="hsl(0, 0%, 60%)" />
            <YAxis stroke="hsl(0, 0%, 60%)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 10%)',
                border: '1px solid hsl(0, 0%, 20%)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="efficiency" fill="hsl(175, 70%, 45%)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="violations" fill="hsl(10, 80%, 55%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Crew Performance Table */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Crew Performance Ranking</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Crew Member
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Performance Score
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Trips
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Violations
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {crewPerformance.map((crew, idx) => (
                <tr
                  key={crew.crew}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-foreground">{crew.crew}</p>
                      <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${crew.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{crew.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">{crew.trips}</td>
                  <td className="py-3 px-4">
                    <span className={crew.violations === 0 ? 'text-green-500 text-sm font-medium' : 'text-orange-500 text-sm font-medium'}>
                      {crew.violations}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-500 text-sm">↑</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
