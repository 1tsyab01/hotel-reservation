'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewType } from '@/types/database'

const roomTypes = ['Standard', 'Deluxe', 'Junior Suite', 'Presidential Suite']
const viewTypes: { value: ViewType; label: string }[] = [
  { value: 'city', label: 'City' },
  { value: 'pool', label: 'Pool' },
  { value: 'garden', label: 'Garden' },
  { value: 'ocean', label: 'Ocean' },
]

export default function RoomFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedType, setSelectedType] = useState(searchParams.get('type') ?? '')
  const [selectedView, setSelectedView] = useState(searchParams.get('view') ?? '')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice') ?? 50),
    Number(searchParams.get('maxPrice') ?? 700),
  ])
  const [minOccupancy, setMinOccupancy] = useState(Number(searchParams.get('occupancy') ?? 1))

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedType) params.set('type', selectedType)
    else params.delete('type')
    if (selectedView) params.set('view', selectedView)
    else params.delete('view')
    params.set('minPrice', String(priceRange[0]))
    params.set('maxPrice', String(priceRange[1]))
    if (minOccupancy > 1) params.set('occupancy', String(minOccupancy))
    else params.delete('occupancy')
    router.push(`/rooms?${params.toString()}`)
  }

  const resetFilters = () => {
    setSelectedType('')
    setSelectedView('')
    setPriceRange([50, 700])
    setMinOccupancy(1)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('type')
    params.delete('view')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('occupancy')
    router.push(`/rooms?${params.toString()}`)
  }

  return (
    <aside className="w-full">
      <div className="surface rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-white font-medium text-sm">Filters</h3>
          </div>
          <button
            onClick={resetFilters}
            className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Room Type */}
        <div className="mb-5">
          <Label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">Room Type</Label>
          <div className="space-y-1.5">
            {roomTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? '' : type)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150',
                  selectedType === type
                    ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-5">
          <Label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">Price Per Night</Label>
          <div className="flex items-center justify-between text-xs text-white/50 mb-3">
            <span className="mono">${priceRange[0]}</span>
            <span className="mono">${priceRange[1]}</span>
          </div>
          <Slider
            min={50}
            max={700}
            step={10}
            value={priceRange}
            onValueChange={(val) => setPriceRange(val as [number, number])}
            className="[&_[role=slider]]:bg-[#6366F1] [&_[role=slider]]:border-[#6366F1]"
          />
        </div>

        {/* Min Occupancy */}
        <div className="mb-5">
          <Label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">
            Min. Guests: <span className="text-white mono">{minOccupancy}</span>
          </Label>
          <Slider
            min={1}
            max={4}
            step={1}
            value={[minOccupancy]}
            onValueChange={(val) => setMinOccupancy(val[0])}
            className="[&_[role=slider]]:bg-[#6366F1] [&_[role=slider]]:border-[#6366F1]"
          />
        </div>

        {/* View Type */}
        <div className="mb-6">
          <Label className="text-xs text-white/50 uppercase tracking-wider mb-3 block">View Type</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {viewTypes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedView(selectedView === value ? '' : value)}
                className={cn(
                  'px-3 py-2 rounded-md text-xs font-medium transition-all duration-150',
                  selectedView === value
                    ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30'
                    : 'bg-white/5 text-white/50 hover:text-white border border-white/5'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={applyFilters}
          className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white py-2 text-sm font-medium rounded-md transition-colors duration-150"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  )
}
