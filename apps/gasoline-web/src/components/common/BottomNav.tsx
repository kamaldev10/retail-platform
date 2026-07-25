'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Fuel, Landmark, ShoppingCart, FileText, Users } from 'lucide-react'
import { useGasolineStore } from '@/store/useGasolineStore'

export function BottomNav() {
	const pathname = usePathname()
	const { dailyRecaps, syncStatus } = useGasolineStore()

	// Count un-synced recaps (if syncStatus is error or recaps exist)
	const pendingCount = syncStatus === 'error' ? dailyRecaps.length : 0

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
			label: 'Stok',
			href: '/stock',
			icon: Fuel,
			ariaLabel: 'Layar Stok Opname Tangki & Botol',
		},
		{
			label: 'Laporan',
			href: '/report',
			icon: FileText,
			ariaLabel: 'Layar Laporan Rekap Harian',
			badge: pendingCount > 0 ? pendingCount : undefined,
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
							{/* Active pill background glow */}
							{isActive && (
								<span
									aria-hidden="true"
									className="absolute top-1.5 w-8 h-8 bg-orange-500/20 rounded-full blur-sm"
								/>
							)}

							<div className="relative">
								<Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
								{item.badge !== undefined && (
									<span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-extrabold rounded-full shadow-sm animate-pulse">
										{item.badge}
									</span>
								)}
							</div>
							<span className="text-[10px] tracking-tight leading-none">{item.label}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
