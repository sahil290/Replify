import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
}

export default function MetricCard({ label, value, change, trend = 'neutral', icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {change && (
        <p className={cn(
          'text-xs font-medium',
          trend === 'up'   && 'text-emerald-600',
          trend === 'down' && 'text-red-600',
          trend === 'neutral' && 'text-gray-400',
        )}>
          {change}
        </p>
      )}
    </div>
  )
}