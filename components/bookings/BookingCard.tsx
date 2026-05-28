'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatCurrency, formatDateRange, getNights } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmModal from '@/components/shared/ConfirmModal'
import type { BookingWithDetails } from '@/types/database'
import { CalendarDays, BedDouble, Moon, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface BookingCardProps {
  booking: BookingWithDetails
  onCancelled?: () => void
}

const roomImages: Record<string, string> = {
  Standard: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Deluxe: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Junior Suite': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Presidential Suite': 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=400',
}

export default function BookingCard({ booking, onCancelled }: BookingCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const nights = getNights(booking.check_in_date, booking.check_out_date)
  const roomType = booking.rooms?.room_types?.name ?? 'Standard'
  const imageUrl = roomImages[roomType] ?? roomImages['Standard']

  const canCancel = ['pending', 'confirmed'].includes(booking.status)

  const handleCancel = async () => {
    setCancelling(true)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', booking.id)
    setCancelling(false)
    setConfirmOpen(false)
    onCancelled?.()
    router.refresh()
  }

  return (
    <>
      <div className="surface rounded-xl overflow-hidden hover:border-[#6366F1]/20 transition-all duration-200">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-32 h-28 sm:h-auto shrink-0 overflow-hidden">
            <img
              src={imageUrl}
              alt={roomType}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium text-sm">Room {booking.rooms?.room_number}</h3>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/50 text-xs">{roomType}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <CalendarDays className="w-3 h-3" />
                  {formatDateRange(booking.check_in_date, booking.check_out_date)}
                </div>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <Moon className="w-3 h-3" />
                {nights} night{nights !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <BedDouble className="w-3 h-3" />
                {booking.num_adults + (booking.num_children ?? 0)} guest{(booking.num_adults + (booking.num_children ?? 0)) !== 1 ? 's' : ''}
              </div>
              <div className="ml-auto text-white font-semibold text-sm mono">
                {formatCurrency(booking.total_amount)}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1F1F1F]">
              <Link
                href={`/booking/${booking.id}`}
                className="text-xs text-[#6366F1] hover:text-[#818CF8] flex items-center gap-1 transition-colors"
              >
                View details <ChevronRight className="w-3 h-3" />
              </Link>
              {canCancel && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={cancelling}
                  className="text-xs text-white/30 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for Room ${booking.rooms?.room_number}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Booking"
        onConfirm={handleCancel}
        destructive
      />
    </>
  )
}
