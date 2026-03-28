'use client'

import { useState } from 'react'
import { Bell, Shield, Users, FileText, LogOut, Lock, Eye, EyeOff, Save, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'security' | 'permissions' | 'audit' | 'notifications'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin account and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-1 flex-wrap">
        {(
          [
            { tab: 'profile', label: 'Profile', icon: Users },
            { tab: 'security', label: 'Security', icon: Shield },
            { tab: 'permissions', label: 'Permissions', icon: Lock },
            { tab: 'audit', label: 'Audit Log', icon: FileText },
            { tab: 'notifications', label: 'Notifications', icon: Bell },
          ] as const
        ).map(({ tab, label }) => (
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
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="max-w-2xl p-6 rounded-xl border border-border bg-card space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <Input
                      type="text"
                      defaultValue="Admin"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    <Input
                      type="text"
                      defaultValue="User"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    defaultValue="admin@quicktransit.com"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Department
                  </label>
                  <Input
                    type="text"
                    defaultValue="Operations Management"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Account Status</h3>
                  <p className="text-sm text-green-500 mt-1">Active and verified</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          {/* Change Password */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-secondary border-border pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 12 characters with upper, lower, number and special character
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-secondary border-border"
              />
            </div>

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Update Password
            </Button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add an extra layer of security
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                Enabled
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Your 2FA is currently enabled. Your authenticator app will be required for login.
            </p>
            <Button variant="outline" className="mt-4 bg-transparent">
              Manage 2FA Settings
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h2>
            <div className="space-y-3">
              {[
                { device: 'Chrome on macOS', location: 'New York, USA', lastActive: 'Now' },
                { device: 'Safari on iPhone', location: 'New York, USA', lastActive: '2h ago' },
              ].map((session, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-secondary/50 border border-border flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    <p className="text-xs text-muted-foreground">{session.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                    <button className="text-xs text-blue-500 hover:text-blue-400 mt-1">
                      Sign Out
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Permissions</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You are assigned the <span className="font-semibold text-foreground">Super Admin</span>{' '}
              role with full system access.
            </p>

            <div className="space-y-3">
              {[
                { category: 'Dashboard', access: 'Full Access' },
                { category: 'Fleet Management', access: 'Full Access' },
                { category: 'Crew Management', access: 'Full Access' },
                { category: 'Route Management', access: 'Full Access' },
                { category: 'Operations', access: 'Full Access' },
                { category: 'Safety & Violations', access: 'Full Access' },
                { category: 'Analytics', access: 'Full Access' },
                { category: 'Settings', access: 'Full Access' },
              ].map((perm) => (
                <div
                  key={perm.category}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <span className="text-sm text-foreground">{perm.category}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">
                    {perm.access}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Role Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manage user roles and permissions in the system.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Configure Roles
            </Button>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { action: 'Login', resource: 'Authentication', time: '2024-02-03 09:15', details: 'Chrome on macOS' },
                  { action: 'Created Vehicle', resource: 'Fleet', time: '2024-02-02 14:30', details: 'QT-256' },
                  { action: 'Updated Route', resource: 'Routes', time: '2024-02-02 10:45', details: 'Route A1' },
                  { action: 'Resolved Violation', resource: 'Safety', time: '2024-02-01 16:20', details: 'V-045' },
                ].map((log, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.resource}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.time}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl space-y-6">
          {[
            {
              title: 'Critical Alerts',
              description: 'Receive notifications for critical system issues',
              enabled: true,
            },
            {
              title: 'Violations',
              description: 'Notify when violations are logged',
              enabled: true,
            },
            {
              title: 'Maintenance Due',
              description: 'Remind about upcoming vehicle maintenance',
              enabled: true,
            },
            {
              title: 'Daily Reports',
              description: 'Receive daily operations summary',
              enabled: false,
            },
            {
              title: 'Performance Alerts',
              description: 'Notify when metrics fall below threshold',
              enabled: true,
            },
          ].map((notif) => (
            <div
              key={notif.title}
              className="p-4 rounded-xl border border-border bg-card flex items-start justify-between"
            >
              <div>
                <h3 className="font-medium text-foreground">{notif.title}</h3>
                <p className="text-sm text-muted-foreground">{notif.description}</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-green-500/20">
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-green-500 transition-transform',
                    notif.enabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
