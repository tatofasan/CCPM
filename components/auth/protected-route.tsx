'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // TODO: Replace with actual authentication check
    // This is a placeholder implementation
    const checkAuth = async () => {
      try {
        // In a real implementation, check if user is authenticated
        // and has the required roles
        const isAuthenticated = false // await checkAuthStatus()
        
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // Check roles if specified
        if (roles && roles.length > 0) {
          const userRoles: string[] = [] // await getUserRoles()
          const hasRequiredRole = roles.some(role => userRoles.includes(role))

          if (!hasRequiredRole) {
            router.push('/unauthorized')
            return
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, roles])

  // Show loading state while checking authentication
  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
