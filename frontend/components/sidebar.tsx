'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Navigation,
  AlertTriangle,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Fleet Management',
    href: '/admin/fleet',
    icon: <Truck className="w-5 h-5" />,
    children: [
      { label: 'Vehicles', href: '/admin/fleet/vehicles', icon: <Truck className="w-4 h-4" /> },
      { label: 'Maintenance', href: '/admin/fleet/maintenance', icon: <Truck className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Crew Management',
    href: '/admin/crew',
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: 'Directory', href: '/admin/crew/directory', icon: <Users className="w-4 h-4" /> },
      { label: 'Credentials', href: '/admin/crew/credentials', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Routes & Geo',
    href: '/admin/routes',
    icon: <MapPin className="w-5 h-5" />,
    children: [
      { label: 'Routes', href: '/admin/routes/list', icon: <MapPin className="w-4 h-4" /> },
      { label: 'Geofences', href: '/admin/routes/geofences', icon: <MapPin className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Operations',
    href: '/admin/operations',
    icon: <Navigation className="w-5 h-5" />,
    children: [
      { label: 'Live Trips', href: '/admin/operations/trips', icon: <Navigation className="w-4 h-4" /> },
      { label: 'Trip History', href: '/admin/operations/history', icon: <Navigation className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Safety & Incidents',
    href: '/admin/safety',
    icon: <AlertTriangle className="w-5 h-5" />,
    children: [
      { label: 'Violations', href: '/admin/safety/violations', icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Incidents', href: '/admin/safety/incidents', icon: <AlertTriangle className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: <FileText className="w-5 h-5" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard'])

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center w-full')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            Q
          </div>
          {!isCollapsed && <span className="font-bold text-sidebar-foreground">QuickTransit</span>}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.label}>
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 flex-1"
                >
                  {item.icon}
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
                {item.children && !isCollapsed && (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="p-1 hover:bg-sidebar-accent/50 rounded"
                  >
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedItems.includes(item.label) && 'rotate-180'
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Submenu */}
              {item.children && expandedItems.includes(item.label) && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive(child.href)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                      )}
                    >
                      {child.icon}
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  )
}
