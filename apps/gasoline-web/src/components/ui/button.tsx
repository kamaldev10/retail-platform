import * as React from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'orange'
	size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
		const baseStyles =
			'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95'

		const variantStyles = {
			default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
			destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90',
			outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
			secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
			ghost: 'hover:bg-slate-100 hover:text-slate-900',
			link: 'text-slate-900 underline-offset-4 hover:underline',
			orange: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
		}

		const sizeStyles = {
			default: 'h-10 px-4 py-2',
			sm: 'h-8 rounded-md px-3 text-xs',
			lg: 'h-11 rounded-lg px-8 text-sm',
			icon: 'h-9 w-9 p-0',
		}

		return (
			<button
				className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
				ref={ref}
				disabled={disabled}
				{...props}
			/>
		)
	},
)
Button.displayName = 'Button'

export { Button }
