'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BookingWithDetails } from '@/types/database'

export function useBookings(guestId?: string) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchBookings = async () => {
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('*, rooms(*, room_types(*))')
      .order('created_at', { ascending: false })

    if (guestId) {
      query = query.eq('guest_id', guestId)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings((data ?? []) as BookingWithDetails[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [guestId])

  return { bookings, loading, error, refetch: fetchBookings }
}
