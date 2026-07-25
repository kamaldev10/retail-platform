'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Fuel, Landmark, ShoppingCart, FileText, Users } from 'lucide-react'

export function BottomNav() {
	const pathname = usePathname()
	const navItems = [
		{
			label: 'Beranda',
			href: '/',
			icon: LayoutDashboard,
			ariaLabel: 'Layar Dashboard',
		},
		{
			label: 'Shift',
			href: '/shift',
			icon: ShoppingCart,
			ariaLabel: 'Layar Transaksi Shift',
			noActiveState: true,
		},
		{
			label: 'Stok',
			href: '/stock',
			icon: Fuel,
			ariaLabel: 'Layar Stok Opname',
		},
		{
			label: 'Laporan',
			href: '/report',
			icon: FileText,
			ariaLabel: 'Layar Laporan Rekap',
		},
		{
			label: 'Gaji',
			href: '/salary',
			icon: Users,
			ariaLabel: 'Layar Pengelolaan Gaji',
		},
		{
			label: 'Kas',
			href: '/finance',
			icon: Landmark,
			ariaLabel: 'Layar Buku Kas',
		},
	]

	return (
		<nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)] w-full">
			<div className="flex justify-around items-center h-16">
				{navItems.map(item => {
					const isActive = !item.noActiveState && pathname === item.href
					const Icon = item.icon

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.ariaLabel}
							className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
								isActive
									? 'text-orange-600 font-bold'
									: 'text-gray-500 hover:text-gray-900 font-medium'
							}`}
						>
							<Icon className="w-4 h-4" />
							<span className="text-[10px] leading-none">{item.label}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
