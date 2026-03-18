import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'urgent' | 'medium' | 'low' | 'blue' | 'purple' | 'gray'
  className?: string
}

const variantStyles = {
  urgent: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low:    'bg-emerald-100 text-emerald-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray:   'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}