import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types/database'

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  checked_in: {
    label: 'Checked In',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  checked_out: {
    label: 'Checked Out',
    className: 'bg-white/10 text-white/50 border-white/10',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  },
  no_show: {
    label: 'No Show',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  )
}
