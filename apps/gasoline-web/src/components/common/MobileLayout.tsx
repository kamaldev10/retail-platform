'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { LogOut, Fuel, ShieldCheck } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'

interface MobileLayoutProps {
	children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
	const router = useRouter()
	const pathname = usePathname()
	const isLoginPage = pathname === '/login'

	const handleSignOut = async () => {
		try {
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

	return (
		<div className="min-h-dvh bg-slate-950 flex justify-center w-full overflow-hidden select-none">
			<div className="w-full max-w-md bg-slate-50 flex flex-col h-dvh shadow-2xl relative overflow-hidden">
				<OfflineBanner />
				{isLoginPage ? (
					children
				) : (
					<>
						<header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between flex-shrink-0 pt-[calc(0.75rem+env(safe-area-inset-top))]">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
									<Fuel className="w-4 h-4 text-white" />
								</div>
								<div>
									<h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
										Gasoline Retail
									</h1>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold rounded-full">
									Operator
								</span>
								<button
									onClick={handleSignOut}
									className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
									title="Keluar (Sign Out)"
									aria-label="Tombol Keluar Akun"
								>
									<LogOut className="w-4 h-4" />
								</button>
							</div>
						</header>

						<main className="flex-1 overflow-y-auto pb-24 p-4 bg-slate-100/70">{children}</main>

						<BottomNav />
					</>
				)}
			</div>
		</div>
	)
}
