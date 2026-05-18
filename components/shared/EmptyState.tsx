import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-white/30" />
      </div>
      <h3 className="text-base font-medium text-white/70 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-white/30 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
