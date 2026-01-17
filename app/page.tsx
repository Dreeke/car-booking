'use client'

import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import Calendar from '@/app/components/Calendar'

export default function Home() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto py-6">
        <Calendar />
      </main>
    </div>
  )
}
