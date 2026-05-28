'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RoomWithType } from '@/types/database'

interface UseRoomsOptions {
  type?: string
  viewType?: string
  minPrice?: number
  maxPrice?: number
  minOccupancy?: number
}

export function useRooms(options: UseRoomsOptions = {}) {
  const [rooms, setRooms] = useState<RoomWithType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true)
      let query = supabase
        .from('rooms')
        .select('*, room_types(*)')
        .eq('status', 'available')

      if (options.viewType) {
        query = query.eq('view_type', options.viewType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        let filtered = (data ?? []) as RoomWithType[]

        if (options.type) {
          filtered = filtered.filter((r) => r.room_types.name === options.type)
        }
        if (options.minPrice !== undefined) {
          filtered = filtered.filter((r) => r.room_types.base_price_per_night >= options.minPrice!)
        }
        if (options.maxPrice !== undefined) {
          filtered = filtered.filter((r) => r.room_types.base_price_per_night <= options.maxPrice!)
        }
        if (options.minOccupancy !== undefined) {
          filtered = filtered.filter((r) => r.room_types.max_occupancy >= options.minOccupancy!)
        }

        setRooms(filtered)
      }
      setLoading(false)
    }

    fetchRooms()
  }, [options.type, options.viewType, options.minPrice, options.maxPrice, options.minOccupancy])

  return { rooms, loading, error }
}
