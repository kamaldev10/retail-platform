import * as React from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'orange' | 'success'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
	const baseStyles =
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2'

	const variantStyles = {
		default: 'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80',
		secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80',
		destructive: 'border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80',
		outline: 'text-slate-950 border-slate-200',
		orange: 'border-orange-500/30 bg-orange-500/10 text-orange-600',
		success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
	}

	return <div className={cn(baseStyles, variantStyles[variant], className)} {...props} />
}

export { Badge }
