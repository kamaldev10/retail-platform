'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabaseClient'
import {
	FileText,
	Landmark,
	LayoutDashboard,
	LogOut,
	MoreHorizontal,
	Package,
	ShieldCheck,
	ShoppingCart,
	Smartphone,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export function BottomNav() {
	const pathname = usePathname()
	const router = useRouter()
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	const handleSignOut = async () => {
		try {
			setIsSheetOpen(false)
			const supabase = createClient()
			const { error } = await supabase.auth.signOut()
			if (!error) {
				router.refresh()
				router.push('/login')
			}
		} catch (error) {
			console.error('Sign out error:', error)
		}
	}

	const navItems = [
		{
			label: 'Beranda',
			href: '/',
			icon: LayoutDashboard,
			ariaLabel: 'Halaman Beranda & Dashboard',
		},
		{
			label: 'Shift',
			href: '/shift',
			icon: ShoppingCart,
			ariaLabel: 'Halaman Shift Kerja Kasir',
		},
		{
			label: 'Laporan',
			href: '/report',
			icon: FileText,
			ariaLabel: 'Halaman Laporan Rekap Harian',
		},
		{
			label: 'Keuangan',
			href: '/finance',
			icon: Landmark,
			ariaLabel: 'Halaman Buku Kas & Penggajian',
		},
	]

	return (
		<>
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

					<button
						type="button"
						onClick={() => setIsSheetOpen(true)}
						aria-label="Buka Menu Lainnya"
						className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
							isSheetOpen
								? 'text-orange-400 font-bold scale-105'
								: 'text-slate-400 hover:text-slate-200 font-medium'
						}`}
					>
						<div className="relative">
							<MoreHorizontal className="w-5 h-5" />
						</div>
						<span className="text-[10px] tracking-tight leading-none">Lainnya</span>
					</button>
				</div>
			</nav>

			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} title="Menu & Pengaturan">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
								<ShieldCheck className="w-4 h-4" />
							</div>
							<div>
								<p className="text-xs font-bold text-white leading-tight">Operator SPBU</p>
								<p className="text-[10px] text-slate-400 font-medium">Sistem Retail Platform</p>
							</div>
						</div>
						<Badge variant="orange">Operator Active</Badge>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<Link
							href="/catalog"
							onClick={() => setIsSheetOpen(false)}
							className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors text-slate-200 text-xs font-semibold"
						>
							<Package className="w-4 h-4 text-orange-400" />
							<span>Katalog Produk</span>
						</Link>

						<Link
							href="/salary"
							onClick={() => setIsSheetOpen(false)}
							className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors text-slate-200 text-xs font-semibold"
						>
							<Users className="w-4 h-4 text-emerald-400" />
							<span>Pengelolaan Gaji</span>
						</Link>
					</div>

					<button
						type="button"
						onClick={() => {
							setIsSheetOpen(false)
							window.dispatchEvent(new CustomEvent('open-pwa-install-prompt'))
						}}
						className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold transition-all"
					>
						<div className="flex items-center gap-2">
							<Smartphone className="w-4 h-4 text-orange-400" />
							<span>Pasang Aplikasi PWA di HP</span>
						</div>
						<span className="text-[10px] font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-full">
							Instal
						</span>
					</button>

					<div className="pt-2 border-t border-slate-800">
						<Button
							variant="destructive"
							onClick={handleSignOut}
							className="w-full flex items-center justify-center gap-2"
						>
							<LogOut className="w-4 h-4" />
							<span>Log Out</span>
						</Button>
					</div>
				</div>
			</Sheet>
		</>
	)
}
