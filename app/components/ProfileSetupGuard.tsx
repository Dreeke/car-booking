'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'

// Pages that don't require profile setup
const ALLOWED_PATHS = ['/profile', '/login', '/auth/callback']

export default function ProfileSetupGuard({ children }: { children: React.ReactNode }) {
  const { user, needsProfileSetup, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Only redirect logged-in users who need profile setup
    if (user && needsProfileSetup) {
      // Check if current path is allowed
      const isAllowedPath = ALLOWED_PATHS.some(path => pathname.startsWith(path))

      if (!isAllowedPath) {
        router.replace('/profile?setup=true')
      }
    }
  }, [user, needsProfileSetup, loading, pathname, router])

  return <>{children}</>
}
