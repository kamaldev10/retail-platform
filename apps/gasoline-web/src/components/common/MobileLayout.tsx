'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { LogOut, Fuel, ShieldCheck } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { SyncStatusBanner } from './SyncStatusBanner'

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
				{isLoginPage ? (
					children
				) : (
					<>
						<SyncStatusBanner />

						<SyncStatusBanner />

						<main className="flex-1 overflow-y-auto pb-24 p-4 bg-slate-100/70">{children}</main>

						<BottomNav />
					</>
				)}
			</div>
		</div>
	)
}
