import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { BookingWithDetails } from '@/types/database'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatCurrency, getNights } from '@/lib/utils'
import { CircleCheck as CheckCircle2, ArrowRight, Users, Moon } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function BookingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, rooms(*, room_types(*))')
    .eq('id', params.id)
    .maybeSingle()

  if (!booking) notFound()

  const typedBooking = booking as BookingWithDetails
  const nights = getNights(typedBooking.check_in_date, typedBooking.check_out_date)

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="surface rounded-xl p-6 mb-8 border-l-4 border-emerald-400">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Booking Created</h1>
              <p className="text-white/60">Your reservation has been submitted. Our team will confirm within 24 hours.</p>
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-6 space-y-6 mb-8">
          <div>
            <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Booking Reference</div>
            <div className="mono text-lg font-semibold text-white">{typedBooking.id.slice(0, 8).toUpperCase()}</div>
          </div>

          <div className="border-t border-[#1F1F1F] pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold mb-1">
                  {typedBooking.rooms?.room_types?.name} · Room {typedBooking.rooms?.room_number}
                </h2>
                <p className="text-white/40 text-sm">Floor {typedBooking.rooms?.floor}</p>
              </div>
              <StatusBadge status={typedBooking.status} />
            </div>
          </div>

          <div className="border-t border-[#1F1F1F] pt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Check-in</div>
              <div className="text-white font-semibold">{typedBooking.check_in_date}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Check-out</div>
              <div className="text-white font-semibold">{typedBooking.check_out_date}</div>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Moon className="w-4 h-4" />
              <span>{nights} night{nights !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Users className="w-4 h-4" />
              <span>{typedBooking.num_adults + (typedBooking.num_children ?? 0)} guest{(typedBooking.num_adults + (typedBooking.num_children ?? 0)) !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {typedBooking.special_requests && (
            <div className="border-t border-[#1F1F1F] pt-6">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Special Requests</div>
              <p className="text-white/70">{typedBooking.special_requests}</p>
            </div>
          )}

          <div className="border-t border-[#1F1F1F] pt-6 space-y-2">
            <div className="flex justify-between text-sm text-white/50">
              <span>{formatCurrency(typedBooking.price_per_night)} × {nights} night{nights !== 1 ? 's' : ''}</span>
              <span className="mono">{formatCurrency(typedBooking.price_per_night * nights)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-[#1F1F1F]">
              <span>Total</span>
              <span className="mono">{formatCurrency(typedBooking.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">What's next?</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-xs font-semibold shrink-0">1</span>
              <div>
                <div className="text-white text-sm font-medium">Confirmation Email</div>
                <div className="text-white/40 text-xs">We'll send a confirmation to your email within 24 hours</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-xs font-semibold shrink-0">2</span>
              <div>
                <div className="text-white text-sm font-medium">Payment</div>
                <div className="text-white/40 text-xs">Pay the deposit or full amount before your check-in date</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-xs font-semibold shrink-0">3</span>
              <div>
                <div className="text-white text-sm font-medium">Check-in</div>
                <div className="text-white/40 text-xs">Arrive anytime after 3 PM on your check-in date</div>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white px-6 py-3 font-semibold text-sm rounded-md transition-colors text-center flex items-center justify-center gap-2"
          >
            View Your Bookings <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/rooms"
            className="flex-1 border border-[#1F1F1F] text-white/60 hover:text-white hover:border-white/20 px-6 py-3 font-semibold text-sm rounded-md transition-all text-center"
          >
            Browse More Rooms
          </Link>
        </div>
      </div>
    </div>
  )
}
