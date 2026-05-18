import { createClient } from '@/lib/supabase/server'
import type { RoomWithType } from '@/types/database'
import BookingForm from '@/components/bookings/BookingForm'
import { Wifi, Users, Eye, Zap } from 'lucide-react'
import { notFound } from 'next/navigation'

const roomImages: Record<string, string> = {
  Standard: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200',
  Deluxe: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Junior Suite': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Presidential Suite': 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

const viewLabels: Record<string, string> = {
  city: 'City View',
  pool: 'Pool View',
  garden: 'Garden View',
  ocean: 'Ocean View',
  none: 'Interior',
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Record<string, string>
}) {
  const supabase = await createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*, room_types(*)')
    .eq('id', params.id)
    .maybeSingle()

  if (!room) notFound()

  const typedRoom = room as RoomWithType
  const imageUrl = roomImages[typedRoom.room_types.name] ?? roomImages['Standard']
  const amenities = Array.isArray(typedRoom.room_types.amenities) ? typedRoom.room_types.amenities : []

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      <div className="relative h-96 overflow-hidden">
        <img src={imageUrl} alt={`${typedRoom.room_types.name} Room`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-md bg-[#6366F1]/10 text-[#818CF8] text-xs font-medium border border-[#6366F1]/20">
                  {typedRoom.room_types.name}
                </span>
                <span className="text-white/40 text-sm">Room {typedRoom.room_number}</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{typedRoom.room_types.name}</h1>
              <p className="text-white/50">Floor {typedRoom.floor} · {viewLabels[typedRoom.view_type ?? 'none']}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-3">About this room</h2>
              <p className="text-white/60 leading-relaxed">{typedRoom.room_types.description}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="surface rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-[#818CF8]" />
                  <span className="text-white/60 text-xs">Occupancy</span>
                </div>
                <div className="text-white font-semibold">Up to {typedRoom.room_types.max_occupancy}</div>
              </div>
              <div className="surface rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-[#818CF8]" />
                  <span className="text-white/60 text-xs">View</span>
                </div>
                <div className="text-white font-semibold">{viewLabels[typedRoom.view_type ?? 'none']}</div>
              </div>
              <div className="surface rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#818CF8]" />
                  <span className="text-white/60 text-xs">Status</span>
                </div>
                <div className="text-white font-semibold capitalize">{typedRoom.status}</div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-white/70 text-sm">
                    <Wifi className="w-4 h-4 text-[#818CF8]" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <BookingForm
              room={typedRoom}
              defaultCheckIn={searchParams.checkIn}
              defaultCheckOut={searchParams.checkOut}
              defaultGuests={searchParams.guests ? Number(searchParams.guests) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
