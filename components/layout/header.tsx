'use client'

import { Bell, User, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1">
          {/* Breadcrumbs will be rendered here by the Breadcrumbs component */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="relative rounded-full p-2 hover:bg-accent"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-popover p-4 shadow-lg">
                <h3 className="mb-3 font-semibold">Notifications</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-2 rounded-full hover:bg-accent p-2"
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden text-sm font-medium md:block">
                Admin User
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-popover shadow-lg">
                <div className="p-2">
                  <button
                    type="button"
                    className="flex w-full items-center space-x-2 rounded px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center space-x-2 rounded px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
