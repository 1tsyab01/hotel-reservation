import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { BookingStatus } from '@/types/database'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  CalendarCheck,
  DollarSign,
  BedDouble,
  BarChart3,
  ArrowUpRight,
  Clock,
} from 'lucide-react'

interface RecentBooking {
  id: string
  status: BookingStatus
  check_in_date: string
  check_out_date: string
  total_amount: number
  created_at: string
  rooms: {
    room_number: string
    room_types: {
      name: string
    }
  } | null
  guests: {
    users: {
      full_name: string
      email: string
    } | null
  } | null
}

async function getAdminStats() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [bookingsTodayRes, revenueMonthRes, roomsRes, recentRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStr)
      .lte('created_at', todayStr + 'T23:59:59.999Z'),

    supabase
      .from('bookings')
      .select('total_amount')
      .in('status', ['confirmed', 'checked_in', 'checked_out'])
      .gte('created_at', monthStart),

    supabase
      .from('rooms')
      .select('id, status'),

    supabase
      .from('bookings')
      .select(`
        id,
        status,
        check_in_date,
        check_out_date,
        total_amount,
        created_at,
        rooms(room_number, room_types(name)),
        guests(users(full_name, email))
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const bookingsToday = bookingsTodayRes.count ?? 0

  const revenueMonth = (revenueMonthRes.data ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0
  )

  const allRooms = roomsRes.data ?? []
  const totalRooms = allRooms.length
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  const recentBookings = (recentRes.data ?? []) as unknown as RecentBooking[]

  return {
    bookingsToday,
    revenueMonth,
    occupiedRooms,
    totalRooms,
    occupancyRate,
    recentBookings,
  }
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login?redirectTo=/admin')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', authUser.id)
    .maybeSingle()

  if (!userData || userData.role !== 'admin') {
    redirect('/dashboard')
  }

  const stats = await getAdminStats()

  const statCards = [
    {
      label: 'Bookings Today',
      value: String(stats.bookingsToday),
      icon: CalendarCheck,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      sub: 'Created today',
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(stats.revenueMonth),
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      sub: 'Confirmed',
    },
    {
      label: 'Rooms Occupied',
      value: `${stats.occupiedRooms} / ${stats.totalRooms}`,
      icon: BedDouble,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      sub: 'Currently occupied',
    },
    {
      label: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: BarChart3,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      sub: `${stats.totalRooms} total rooms`,
    },
  ]

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs text-sky-400 uppercase tracking-widest font-medium mb-2">
            Administration
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-white/40 text-sm mt-1">
                Welcome back, {userData.full_name} &middot; Hotel operations overview
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 bg-white/5 border border-white/8 px-3 py-1.5 rounded-md shrink-0">
              <Clock className="w-3 h-3" />
              {dateLabel}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="surface rounded-xl p-5 hover:border-white/10 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/10" />
                </div>
                <div className="text-2xl font-bold text-white mono mb-0.5">{card.value}</div>
                <div className="text-xs font-medium text-white/50">{card.label}</div>
                <div className="text-[11px] text-white/25 mt-0.5">{card.sub}</div>
              </div>
            )
          })}
        </div>

        {/* Occupancy Progress Bar */}
        <div className="surface rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-white">Room Occupancy</div>
              <div className="text-xs text-white/40 mt-0.5">
                {stats.occupiedRooms} of {stats.totalRooms} rooms currently occupied
              </div>
            </div>
            <div className="text-xl font-bold text-white mono">{stats.occupancyRate}%</div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/20 mt-1.5">
            <span>Empty</span>
            <span>Full</span>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="surface rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1F1F1F]">
            <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
            <p className="text-xs text-white/40 mt-0.5">Last 10 reservations across all guests</p>
          </div>

          {stats.recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-white/40 text-sm">No bookings yet</p>
              <p className="text-white/20 text-xs mt-1">Bookings will appear here once guests start reserving rooms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Ref', 'Guest', 'Room', 'Dates', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[11px] text-white/25 font-medium uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161616]">
                  {stats.recentBookings.map((booking) => {
                    const guestName = booking.guests?.users?.full_name ?? 'Unknown Guest'
                    const guestEmail = booking.guests?.users?.email ?? ''
                    const roomNumber = booking.rooms?.room_number ?? '—'
                    const roomType = booking.rooms?.room_types?.name ?? '—'

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-white/[0.02] transition-colors duration-100"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="mono text-xs text-white/40 font-medium tracking-wide">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white text-sm font-medium leading-snug">{guestName}</div>
                          <div className="text-white/30 text-xs">{guestEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white text-sm">Room {roomNumber}</div>
                          <div className="text-white/30 text-xs">{roomType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white/70 text-sm">
                            {formatDateShort(booking.check_in_date)}
                          </div>
                          <div className="text-white/30 text-xs">
                            to {formatDateShort(booking.check_out_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="mono text-white font-semibold text-sm">
                            {formatCurrency(booking.total_amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={`/booking/${booking.id}`}
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
                          >
                            View
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
