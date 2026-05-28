import Link from 'next/link'
import Image from 'next/image'
import { Eye, Users, Star, Wifi, TvMinimal, Wind } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { RoomWithType } from '@/types/database'

interface RoomCardProps {
  room: RoomWithType
  checkIn?: string
  checkOut?: string
  guests?: number
}

const roomImages: Record<string, string> = {
  Standard:
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
  Deluxe:
    'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Junior Suite':
    'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Presidential Suite':
    'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=800',
}

const viewLabels: Record<string, string> = {
  city: 'City View',
  pool: 'Pool View',
  garden: 'Garden View',
  ocean: 'Ocean View',
  none: 'Interior',
}

const amenityIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  WiFi: Wifi,
  TV: TvMinimal,
  'Smart TV': TvMinimal,
  AC: Wind,
}

export default function RoomCard({
  room,
  checkIn,
  checkOut,
  guests,
}: RoomCardProps) {
  const imageUrl =
    roomImages[room.room_types.name] ?? roomImages['Standard']

  const isAvailable = room.status === 'available'

  const href =
    checkIn && checkOut
      ? `/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${
          guests ?? 1
        }`
      : `/rooms/${room.id}`

  const amenities = Array.isArray(room.room_types.amenities)
    ? room.room_types.amenities
    : []

  return (
    <div className="group surface rounded-xl overflow-hidden hover:border-[#6366F1]/30 transition-all duration-200 hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${room.room_types.name} Room ${room.room_number}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Room Number Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={cn(
              'text-xs px-2 py-1 rounded font-medium',
              room.room_types.name === 'Presidential Suite'
                ? 'bg-amber-500 text-black'
                : 'bg-[#6366F1] text-white'
            )}
          >
            Room {room.room_number}
          </span>
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white/80 text-sm font-medium bg-black/60 px-3 py-1 rounded">
              Unavailable
            </span>
          </div>
        )}

        {room.view_type && room.view_type !== 'none' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90 text-xs">
            <Eye className="w-3 h-3" />
            {viewLabels[room.view_type]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            {/* Room Type Title */}
            <h3 className="text-white font-semibold text-base">
              {room.room_types.name}
            </h3>

            <p className="text-white/40 text-xs mt-0.5">
              Floor {room.floor}
            </p>
          </div>

          <div className="text-right">
            <div className="text-white font-bold text-lg mono">
              {formatCurrency(room.room_types.base_price_per_night)}
            </div>

            <div className="text-white/40 text-xs">/ night</div>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flex items-center gap-1 text-white/50 text-xs mb-3">
          <Users className="w-3 h-3" />
          <span>
            Up to {room.room_types.max_occupancy} guests
          </span>
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="text-[11px] px-2 py-0.5 rounded-sm bg-white/5 text-white/50 border border-white/8"
            >
              {amenity}
            </span>
          ))}

          {amenities.length > 4 && (
            <span className="text-[11px] px-2 py-0.5 rounded-sm bg-white/5 text-white/40">
              +{amenities.length - 4}
            </span>
          )}
        </div>

        <Link
          href={href}
          className={cn(
            'block w-full text-center py-2 text-sm font-medium rounded-md transition-all duration-150',
            isAvailable
              ? 'bg-[#6366F1] hover:bg-[#5558E3] text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed pointer-events-none'
          )}
        >
          {isAvailable ? 'Book Now' : 'Unavailable'}
        </Link>
      </div>
    </div>
  )
}
