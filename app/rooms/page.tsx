import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { RoomWithType, ViewType } from '@/types/database'
import RoomCard from '@/components/rooms/RoomCard'
import RoomFilters from '@/components/rooms/RoomFilters'
import EmptyState from '@/components/shared/EmptyState'
import { BedDouble, SlidersHorizontal } from 'lucide-react'

interface SearchParams {
  type?: string
  view?: string
  minPrice?: string
  maxPrice?: string
  occupancy?: string
  checkIn?: string
  checkOut?: string
  guests?: string
}

async function getRooms(params: SearchParams): Promise<RoomWithType[]> {
  const supabase = await createClient()

  let query = supabase
    .from('rooms')
    .select('*, room_types(*)')
    .eq('status', 'available')

  if (params.view) {
    query = query.eq('view_type', params.view as ViewType)
  }

  const { data, error } = await query

  if (error || !data) return []

  let rooms = data as RoomWithType[]

  if (params.type) {
    rooms = rooms.filter((r) => r.room_types.name === params.type)
  }
  if (params.minPrice) {
    rooms = rooms.filter((r) => r.room_types.base_price_per_night >= Number(params.minPrice))
  }
  if (params.maxPrice) {
    rooms = rooms.filter((r) => r.room_types.base_price_per_night <= Number(params.maxPrice))
  }
  if (params.occupancy) {
    rooms = rooms.filter((r) => r.room_types.max_occupancy >= Number(params.occupancy))
  }

  return rooms
}

export default async function RoomsPage({ searchParams }: { searchParams: SearchParams }) {
  const rooms = await getRooms(searchParams)
  const { checkIn, checkOut, guests } = searchParams

  const hasFilters = !!(searchParams.type || searchParams.view || searchParams.minPrice || searchParams.maxPrice || searchParams.occupancy)

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      {/* Header */}
      <div className="border-b border-[#1F1F1F] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Accommodations</div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Our Rooms & Suites</h1>
              <p className="text-white/40 text-sm mt-1">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
                {checkIn && checkOut && ` · ${checkIn} to ${checkOut}`}
              </p>
            </div>
            {hasFilters && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#818CF8] bg-[#6366F1]/10 px-3 py-1.5 rounded-md border border-[#6366F1]/20">
                <SlidersHorizontal className="w-3 h-3" />
                Filters active
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <Suspense fallback={null}>
              <RoomFilters />
            </Suspense>
          </div>

          {/* Rooms Grid */}
          <div className="flex-1 min-w-0">
            {rooms.length === 0 ? (
              <EmptyState
                icon={BedDouble}
                title="No rooms match your filters"
                description="Try adjusting your search criteria or removing some filters to see available rooms."
                action={
                  <a href="/rooms" className="text-sm text-[#818CF8] hover:text-white transition-colors border border-[#6366F1]/30 px-4 py-2 rounded-md">
                    Clear all filters
                  </a>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests ? Number(guests) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
