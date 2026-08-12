'use client'

import { useState, useEffect } from 'react'
import { Download, X, Fuel, Smartphone, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
	const [showBanner, setShowBanner] = useState(false)
	const [isInstalled, setIsInstalled] = useState(false)
	const [isIOS, setIsIOS] = useState(false)

	useEffect(() => {
		// Check standalone mode
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as unknown as { standalone?: boolean }).standalone === true

		if (isStandalone) {
			setIsInstalled(true)
			return
		}

		// Detect iOS Safari
		const ua = window.navigator.userAgent
		const isIOSUser =
			/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
		setIsIOS(isIOSUser)

		// Show banner by default if not dismissed in session
		const dismissed = sessionStorage.getItem('pwa_banner_dismissed')
		if (dismissed !== 'true') {
			setShowBanner(true)
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
			if (sessionStorage.getItem('pwa_banner_dismissed') !== 'true') {
				setShowBanner(true)
			}
		}

		const handleAppInstalled = () => {
			setIsInstalled(true)
			setShowBanner(false)
			setDeferredPrompt(null)
		}

		const handleCustomOpen = () => {
			sessionStorage.removeItem('pwa_banner_dismissed')
			setShowBanner(true)
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
		window.addEventListener('appinstalled', handleAppInstalled)
		window.addEventListener('open-pwa-install-prompt', handleCustomOpen)

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
			window.removeEventListener('appinstalled', handleAppInstalled)
			window.removeEventListener('open-pwa-install-prompt', handleCustomOpen)
		}
	}, [])

	const handleInstallClick = async () => {
		if (deferredPrompt) {
			deferredPrompt.prompt()
			const { outcome } = await deferredPrompt.userChoice
			if (outcome === 'accepted') {
				setIsInstalled(true)
			}
			setDeferredPrompt(null)
			setShowBanner(false)
		} else {
			// Fallback alert for Chrome/Edge manual menu install instructions
			alert(
				'Untuk memasain di Chrome/Edge: Ketuk menu titik tiga (⋮) ➔ pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"',
			)
		}
	}

	const handleDismiss = () => {
		setShowBanner(false)
		sessionStorage.setItem('pwa_banner_dismissed', 'true')
	}

	if (!showBanner || isInstalled) return null

	return (
		<div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 z-50 animate-in slide-in-from-bottom duration-300">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md flex-shrink-0">
						<Fuel className="w-5 h-5 text-white" />
					</div>
					<div>
						<div className="flex items-center gap-1.5">
							<h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
								<Smartphone className="w-3.5 h-3.5 text-orange-400" />
								<span>Pasang Aplikasi Gasoline</span>
							</h3>
							<span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded">
								PWA
							</span>
						</div>
						<p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
							{isIOS
								? "Ketuk 'Bagikan' di Safari ➔ 'Tambah ke Layar Utama'"
								: 'Akses instan di HP dengan layar penuh & offline.'}
						</p>
					</div>
				</div>
				<button
					onClick={handleDismiss}
					className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
					aria-label="Tutup prompt"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			<div className="mt-3 flex items-center gap-2">
				{deferredPrompt ? (
					<button
						onClick={handleInstallClick}
						className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
					>
						<Download className="w-4 h-4" />
						<span>Instal 1-Klik</span>
					</button>
				) : isIOS ? (
					<div className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
						<Share className="w-3.5 h-3.5 text-orange-400" />
						<span>Petunjuk iOS: Bagikan ➔ Utamakan</span>
					</div>
				) : (
					<button
						onClick={handleInstallClick}
						className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
					>
						<Download className="w-4 h-4" />
						<span>Instal Aplikasi</span>
					</button>
				)}
				<button
					onClick={handleDismiss}
					className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2.5 px-3 rounded-xl transition-colors"
				>
					Nanti
				</button>
			</div>
		</div>
	)
}
