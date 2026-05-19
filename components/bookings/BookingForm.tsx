'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getNights, toISODate, addDays } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { RoomWithType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarIcon, Users, Minus, Plus, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingFormProps {
  room: RoomWithType
  defaultCheckIn?: string
  defaultCheckOut?: string
  defaultGuests?: number
}

export default function BookingForm({ room, defaultCheckIn, defaultCheckOut, defaultGuests = 1 }: BookingFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const today = toISODate(new Date())
  const tomorrow = toISODate(addDays(new Date(), 1))

  const [checkIn, setCheckIn] = useState(defaultCheckIn ?? today)
  const [checkOut, setCheckOut] = useState(defaultCheckOut ?? tomorrow)
  const [numAdults, setNumAdults] = useState(Math.min(defaultGuests, room.room_types.max_occupancy))
  const [numChildren, setNumChildren] = useState(0)
  const [specialRequests, setSpecialRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nights = getNights(checkIn, checkOut)
  const totalGuests = numAdults + numChildren
  const pricePerNight = room.room_types.base_price_per_night
  const totalAmount = pricePerNight * Math.max(nights, 0)

  useEffect(() => {
    if (!checkIn || !checkOut || nights <= 0) return
    checkAvailability()
  }, [checkIn, checkOut, room.id])

  const checkAvailability = async () => {
    setChecking(true)
    try {
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', room.id)
        .not('status', 'in', '("cancelled","checked_out")')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn)
        .limit(1)

      setAvailable(!data || data.length === 0)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (nights <= 0) {
      setError('Check-out must be after check-in.')
      return
    }
    if (totalGuests > room.room_types.max_occupancy) {
      setError(`Maximum occupancy is ${room.room_types.max_occupancy} guests.`)
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirectTo=/rooms/${room.id}`)
        return
      }

      // Verify guest record exists
      const { data: guestData } = await supabase
        .from('guests')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!guestData) {
        setError('Your guest profile is not set up. Please contact support.')
        return
      }

      // Double-check availability before booking
      const { data: conflictingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', room.id)
        .not('status', 'in', '("cancelled","checked_out")')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn)
        .limit(1)

      if (conflictingBookings && conflictingBookings.length > 0) {
        setError('Room is no longer available for these dates.')
        setAvailable(false)
        return
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_id: user.id,
          room_id: room.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          num_adults: numAdults,
          num_children: numChildren,
          price_per_night: pricePerNight,
          total_amount: totalAmount,
          deposit_paid: 0,
          status: 'pending',
          special_requests: specialRequests || null,
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError

      toast({
        title: 'Booking created successfully!',
        description: `Your booking reference: ${booking.id.slice(0, 8).toUpperCase()}`,
      })

      router.push(`/booking/${booking.id}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Booking failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-xl p-5 space-y-4 sticky top-24">
      <div>
        <div className="text-2xl font-bold text-white mono">
          {formatCurrency(pricePerNight)}
        </div>
        <div className="text-white/40 text-sm">per night</div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Check-in</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="pl-8 bg-[#1A1A1A] border-[#2A2A2A] text-white text-sm focus:border-[#6366F1] [color-scheme:dark]"
              required
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Check-out</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="pl-8 bg-[#1A1A1A] border-[#2A2A2A] text-white text-sm focus:border-[#6366F1] [color-scheme:dark]"
              required
            />
          </div>
        </div>
      </div>

      {/* Guests */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Adults</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNumAdults(Math.max(1, numAdults - 1))}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white text-sm font-medium w-4 text-center mono">{numAdults}</span>
            <button
              type="button"
              onClick={() => setNumAdults(Math.min(room.room_types.max_occupancy - numChildren, numAdults + 1))}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Children</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNumChildren(Math.max(0, numChildren - 1))}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white text-sm font-medium w-4 text-center mono">{numChildren}</span>
            <button
              type="button"
              onClick={() => setNumChildren(Math.min(room.room_types.max_occupancy - numAdults, numChildren + 1))}
              className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-white/30 flex items-center gap-1">
        <Users className="w-3 h-3" />
        Max {room.room_types.max_occupancy} guests · {totalGuests} selected
      </div>

      {/* Availability indicator */}
      {checking && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Loader2 className="w-3 h-3 animate-spin" />
          Checking availability...
        </div>
      )}
      {!checking && available === false && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Room is not available for these dates.
        </div>
      )}
      {!checking && available === true && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md">
          Available for your dates!
        </div>
      )}

      {/* Special Requests */}
      <div>
        <Label className="text-xs text-white/50 mb-1.5 block">Special Requests (optional)</Label>
        <Textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Early check-in, late checkout, dietary needs..."
          rows={3}
          className="bg-[#1A1A1A] border-[#2A2A2A] text-white text-sm placeholder:text-white/20 focus:border-[#6366F1] resize-none"
        />
      </div>

      {/* Price Summary */}
      {nights > 0 && (
        <div className="border-t border-[#1F1F1F] pt-4 space-y-2">
          <div className="flex justify-between text-sm text-white/50">
            <span>{formatCurrency(pricePerNight)} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span className="mono">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white">
            <span>Total</span>
            <span className="mono">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || available === false || nights <= 0}
        className={cn(
          'w-full py-3 text-sm font-semibold rounded-md transition-all duration-150',
          loading || available === false || nights <= 0
            ? 'bg-white/10 text-white/30 cursor-not-allowed'
            : 'bg-[#6366F1] hover:bg-[#5558E3] text-white'
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : (
          'Reserve Now'
        )}
      </button>
      <p className="text-center text-xs text-white/30">No charge until confirmation</p>
    </form>
  )
}
