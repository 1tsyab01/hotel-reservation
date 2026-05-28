'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Users, Search } from 'lucide-react'
import { toISODate, addDays } from '@/lib/utils'

export default function HomeSearchBar() {
  const router = useRouter()
  const today = toISODate(new Date())
  const nextDay = toISODate(addDays(new Date(), 1))

  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(nextDay)
  const [guests, setGuests] = useState(2)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    })
    router.push(`/rooms?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="max-w-3xl mx-auto glass rounded-xl p-4 shadow-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
        {/* Check-in */}
        <div className="relative flex flex-col gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-white/15 transition-colors">
          <label className="text-xs text-white/40 font-medium">Check-in</label>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#818CF8] shrink-0" />
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-transparent text-white text-sm outline-none w-full [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="relative flex flex-col gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-white/15 transition-colors">
          <label className="text-xs text-white/40 font-medium">Check-out</label>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#818CF8] shrink-0" />
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="bg-transparent text-white text-sm outline-none w-full [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Guests + Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-white/15 transition-colors">
            <label className="text-xs text-white/40 font-medium">Guests</label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#818CF8] shrink-0" />
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-transparent text-white text-sm outline-none w-full"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n} className="bg-[#111] text-white">
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 bg-[#6366F1] hover:bg-[#5558E3] text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors duration-150 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">Search</span>
          </button>
        </div>
      </div>
    </form>
  )
}
