'use client'

import React, { useEffect, useState } from 'react'
import { Download, X, Fuel, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
	const [showBanner, setShowBanner] = useState(false)
	const [isInstalled, setIsInstalled] = useState(false)

	useEffect(() => {
		// Check if already in standalone mode
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as unknown as { standalone?: boolean }).standalone === true

		if (isStandalone) {
			setIsInstalled(true)
			return
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
			setShowBanner(true)
		}

		const handleAppInstalled = () => {
			setIsInstalled(true)
			setShowBanner(false)
			setDeferredPrompt(null)
			console.log('[PWA] Application installed successfully')
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
		window.addEventListener('appinstalled', handleAppInstalled)

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
			window.removeEventListener('appinstalled', handleAppInstalled)
		}
	}, [])

	const handleInstallClick = async () => {
		if (!deferredPrompt) return

		deferredPrompt.prompt()
		const { outcome } = await deferredPrompt.userChoice
		console.log('[PWA] User choice outcome:', outcome)

		setDeferredPrompt(null)
		setShowBanner(false)
	}

	const handleDismiss = () => {
		setShowBanner(false)
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
							<h3 className="text-sm font-bold tracking-tight text-white">
								<Smartphone className="w-3.5 h-3.5" />
								Pasang Aplikasi Gasoline
							</h3>
							<span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded">
								PWA
							</span>
						</div>
						<p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
							Akses instan di HP dengan tampilan layar penuh.
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
				<button
					onClick={handleInstallClick}
					className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
				>
					<Download className="w-3.5 h-3.5" />
					<span>Instal Aplikasi Sekitar</span>
				</button>
				<button
					onClick={handleDismiss}
					className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 px-3 rounded-xl transition-colors"
				>
					Nanti
				</button>
			</div>
		</div>
	)
}
