'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import BookingCard from '@/components/bookings/BookingCard'
import EmptyState from '@/components/shared/EmptyState'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BookingWithDetails, BookingStatus } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, rooms(*, room_types(*))')
        .eq('guest_id', user.id)
        .order('check_in_date', { ascending: false })

      setBookings((data ?? []) as BookingWithDetails[])
      setLoading(false)
    }

    fetchBookings()
  }, [user])

  if (authLoading || loading) return <PageLoader />

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-16 flex items-center justify-center">
        <EmptyState
          icon={LogOut}
          title="Not signed in"
          description="Please sign in to view your bookings"
          action={
            <Link href="/auth/login" className="text-sm bg-[#6366F1] hover:bg-[#5558E3] text-white px-4 py-2 rounded-md transition-colors">
              Sign in
            </Link>
          }
        />
      </div>
    )
  }

  const now = new Date()
  const upcomingBookings = bookings.filter((b) => new Date(b.check_in_date) > now && (b.status === 'pending' || b.status === 'confirmed'))
  const activeBookings = bookings.filter((b) => b.status === 'checked_in')
  const pastBookings = bookings.filter(
    (b) => new Date(b.check_out_date) < now && (b.status === 'checked_out' || b.status === 'checked_in')
  )
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled')

  const handleBookingCancelled = () => {
    // Refetch bookings
    if (user) {
      supabase
        .from('bookings')
        .select('*, rooms(*, room_types(*))')
        .eq('guest_id', user.id)
        .order('check_in_date', { ascending: false })
        .then(({ data }) => {
          setBookings((data ?? []) as BookingWithDetails[])
        })
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.full_name.split(' ')[0]}</h1>
          <p className="text-white/50">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} in total</p>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Start exploring our rooms and make your first reservation"
            action={
              <Link href="/rooms" className="text-sm bg-[#6366F1] hover:bg-[#5558E3] text-white px-4 py-2 rounded-md transition-colors">
                Browse Rooms
              </Link>
            }
          />
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#111] border border-[#1F1F1F]">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#6366F1]/20 data-[state=active]:text-white">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-[#6366F1]/20 data-[state=active]:text-white">
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-[#6366F1]/20 data-[state=active]:text-white">
                Past ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-[#6366F1]/20 data-[state=active]:text-white">
                Cancelled ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3 mt-6">
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming bookings"
                  description="Your upcoming reservations will appear here"
                />
              ) : (
                upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onCancelled={handleBookingCancelled} />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-3 mt-6">
              {activeBookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No active bookings" description="You have no active stays right now" />
              ) : (
                activeBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3 mt-6">
              {pastBookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No past bookings" description="Your previous stays will appear here" />
              ) : (
                pastBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3 mt-6">
              {cancelledBookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No cancelled bookings" description="Your cancelled reservations will appear here" />
              ) : (
                cancelledBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
