/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from "react"

import { useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Route,
  Fuel,
  AlertCircle,
  MapPin,
  Clock,
  MoreVertical,
  Edit,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface VehicleDetailProps {
  onBack?: () => void
}

const performanceData = [
  { date: 'Mon', fuel: 45, efficiency: 92, distance: 120 },
  { date: 'Tue', fuel: 48, efficiency: 88, distance: 135 },
  { date: 'Wed', fuel: 42, efficiency: 95, distance: 110 },
  { date: 'Thu', fuel: 50, efficiency: 85, distance: 145 },
  { date: 'Fri', fuel: 46, efficiency: 91, distance: 125 },
]

const maintenanceLogs = [
  { id: 1, date: '2024-02-01', type: 'Oil Change', cost: '$120', status: 'completed' },
  { id: 2, date: '2024-01-25', type: 'Brake Inspection', cost: '$85', status: 'completed' },
  { id: 3, date: '2024-01-20', type: 'Tire Rotation', cost: '$95', status: 'completed' },
  { id: 4, date: '2024-02-05', type: 'Engine Diagnostic', cost: '$150', status: 'scheduled' },
]

const violationHistory = [
  { id: 1, date: '2024-01-28', type: 'Speeding', severity: 'high', resolved: false },
  { id: 2, date: '2024-01-22', type: 'Route Deviation', severity: 'medium', resolved: true },
  { id: 3, date: '2024-01-15', type: 'Late Arrival', severity: 'low', resolved: true },
]

const tripHistory = [
  { id: 1, date: '2024-02-03 08:30', route: 'Route A1', distance: '45.2 km', duration: '1h 23m', passengers: 42 },
  { id: 2, date: '2024-02-03 10:15', route: 'Route A2', distance: '38.5 km', duration: '1h 12m', passengers: 38 },
  { id: 3, date: '2024-02-02 15:45', route: 'Route A1', distance: '45.2 km', duration: '1h 25m', passengers: 45 },
]

export default function VehicleDetail({ onBack }: VehicleDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'violations' | 'trips'>(
    'overview'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">QT-001</h1>
            <p className="text-muted-foreground">2022 Volvo B11R • 45,230 km</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Status"
          value="Active"
          subtitle="Currently operating"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
        <StatusCard
          title="Risk Score"
          value="12"
          subtitle="Low risk"
          icon={<AlertTriangle className="w-5 h-5 text-green-500" />}
        />
        <StatusCard
          title="Utilization"
          value="94%"
          subtitle="Above average"
          icon={<Route className="w-5 h-5 text-blue-500" />}
        />
        <StatusCard
          title="Fuel Efficiency"
          value="8.2 km/L"
          subtitle="Excellent"
          icon={<Fuel className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-1">
        {(['overview', 'maintenance', 'violations', 'trips'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-3 font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Assigned Driver
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-1">John Smith</p>
                  <p className="text-sm text-muted-foreground">ID: DRV-0042</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Current Route
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-1">Route A1</p>
                  <p className="text-sm text-muted-foreground">Central City Loop</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Maintenance Due
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-1">45 days</p>
                  <p className="text-sm text-muted-foreground">Next: Oil change</p>
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="lg:col-span-2 space-y-4">
              {/* Fuel & Efficiency */}
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Weekly Performance
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
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
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="hsl(175, 70%, 45%)"
                      name="Efficiency %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Incidents Alert */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-500">Maintenance Alert</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Oil change due within 500 km or 5 days.
              </p>
            </div>
            <Button size="sm" className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-500">
              Schedule
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="px-6 py-4 text-sm text-muted-foreground">{log.date}</td>
                  <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    {log.type}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{log.cost}</td>
                  <td className="px-6 py-4">
                    {log.status === 'completed' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        Completed
                      </span>
                    )}
                    {log.status === 'scheduled' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                        Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'violations' && (
        <div className="space-y-3">
          {violationHistory.map((violation) => (
            <div
              key={violation.id}
              className="p-4 rounded-xl border border-border bg-card flex items-start justify-between"
            >
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle
                  className={cn(
                    'w-5 h-5 flex-shrink-0 mt-0.5',
                    violation.severity === 'high'
                      ? 'text-red-500'
                      : violation.severity === 'medium'
                        ? 'text-orange-500'
                        : 'text-yellow-500'
                  )}
                />
                <div>
                  <p className="font-semibold text-foreground">{violation.type}</p>
                  <p className="text-xs text-muted-foreground">{violation.date}</p>
                </div>
              </div>
              <div className="text-right">
                {violation.resolved ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                    Resolved
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Passengers
                </th>
              </tr>
            </thead>
            <tbody>
              {tripHistory.map((trip) => (
                <tr key={trip.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="px-6 py-4 text-sm text-muted-foreground">{trip.date}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{trip.route}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {trip.distance}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {trip.duration}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{trip.passengers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
