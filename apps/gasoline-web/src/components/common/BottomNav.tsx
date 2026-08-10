'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Landmark, ShoppingCart, FileText, Users } from 'lucide-react'

export function BottomNav() {
	const pathname = usePathname()

	const navItems = [
		{
			label: 'Beranda',
			href: '/',
			icon: LayoutDashboard,
			ariaLabel: 'Layar Dashboard Beranda',
		},
		{
			label: 'Shift',
			href: '/shift',
			icon: ShoppingCart,
			ariaLabel: 'Layar Transaksi Shift Operasional',
		},
		{
			label: 'Katalog',
			href: '/catalog',
			icon: Package,
			ariaLabel: 'Layar Katalog Produk',
		},
		{
			label: 'Laporan',
			href: '/report',
			icon: FileText,
			ariaLabel: 'Layar Laporan Rekap Harian',
		},
		{
			label: 'Gaji',
			href: '/salary',
			icon: Users,
			ariaLabel: 'Layar Pengelolaan Gaji Operator',
		},
		{
			label: 'Kas',
			href: '/finance',
			icon: Landmark,
			ariaLabel: 'Layar Kasir & Buku Kas',
		},
	]

	return (
		<nav className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 pb-[env(safe-area-inset-bottom)] w-full">
			<div className="flex justify-around items-center h-16 px-1">
				{navItems.map(item => {
					const isActive = pathname === item.href
					const Icon = item.icon

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.ariaLabel}
							className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
								isActive
									? 'text-orange-400 font-bold scale-105'
									: 'text-slate-400 hover:text-slate-200 font-medium'
							}`}
						>
							{isActive && (
								<span
									aria-hidden="true"
									className="absolute top-1.5 w-8 h-8 bg-orange-500/20 rounded-full blur-sm"
								/>
							)}

							<div className="relative">
								<Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
							</div>
							<span className="text-[10px] tracking-tight leading-none">{item.label}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
