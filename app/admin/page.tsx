'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/shared/EmptyState'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { ChartBar as BarChart, Users, DollarSign, Chrome as Home, CircleAlert as AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Booking, BookingWithDetails } from '@/types/database'

interface AdminStats {
  totalBookings: number
  totalRevenue: number
  occupiedRooms: number
  newGuests: number
  revenueToday: number
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    if (user.role !== 'admin' && user.role !== 'staff') {
      setAuthorized(false)
      setLoading(false)
      return
    }

    setAuthorized(true)

    const fetchStats = async () => {
      try {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, status, total_amount, created_at, check_in_date, check_out_date')

        const typedBookings = bookings as (Booking & { created_at?: string })[] ?? []
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()

        const totalBookings = typedBookings.length
        const totalRevenue = typedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
        const newGuestsCount = typedBookings.filter((b) => b.created_at?.includes(today)).length
        const revenueTodayAmount = typedBookings
          .filter((b) => b.created_at?.includes(today))
          .reduce((sum, b) => sum + (b.total_amount || 0), 0)

        const occupiedRoomsCount = typedBookings.filter((b) => {
          const checkIn = new Date(b.check_in_date)
          const checkOut = new Date(b.check_out_date)
          return b.status === 'checked_in' && checkIn <= now && checkOut > now
        }).length

        setStats({
          totalBookings,
          totalRevenue,
          occupiedRooms: occupiedRoomsCount,
          newGuests: newGuestsCount,
          revenueToday: revenueTodayAmount,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (authLoading || loading) return <PageLoader />

  if (!user || !authorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-16 flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Access Denied"
          description="You do not have permission to access the admin panel"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Administration</div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        </div>

        {/* Stats Grid */}
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Total Bookings</div>
                <BarChart className="w-4 h-4 text-[#818CF8]" />
              </div>
              <div className="text-2xl font-bold text-white mono">{stats.totalBookings}</div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Total Revenue</div>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mono">{formatCurrency(stats.totalRevenue)}</div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Occupied Rooms</div>
                <Home className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mono">{stats.occupiedRooms}</div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">New Guests Today</div>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mono">{stats.newGuests}</div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Revenue Today</div>
                <DollarSign className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-white mono">{formatCurrency(stats.revenueToday)}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">Unable to load statistics</div>
        )}

        {/* Info Section */}
        <div className="mt-12 surface rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Admin Panel Information</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            This admin dashboard provides real-time insights into hotel operations including booking metrics, occupancy rates,
            and revenue tracking. Use these statistics to manage inventory, pricing strategies, and guest relationships.
          </p>
        </div>
      </div>
    </div>
  )
}
