'use client'

import { useState, useEffect } from 'react'
import { X, Fuel, Smartphone, Share, ChevronRight } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type BannerState = 'banner' | 'guide-android' | 'guide-ios' | 'hidden'

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
	const [bannerState, setBannerState] = useState<BannerState>('hidden')
	const [isInstalled, setIsInstalled] = useState(false)
	const [isIOS, setIsIOS] = useState(false)

	useEffect(() => {
		// Check standalone mode (already installed)
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

		// Show banner by default unless dismissed this session
		const dismissed = sessionStorage.getItem('pwa_banner_dismissed')
		if (dismissed !== 'true') {
			setBannerState('banner')
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
			if (sessionStorage.getItem('pwa_banner_dismissed') !== 'true') {
				setBannerState('banner')
			}
		}

		const handleAppInstalled = () => {
			setIsInstalled(true)
			setBannerState('hidden')
			setDeferredPrompt(null)
		}

		const handleCustomOpen = () => {
			sessionStorage.removeItem('pwa_banner_dismissed')
			setBannerState('banner')
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
			// Native browser install dialog
			deferredPrompt.prompt()
			const { outcome } = await deferredPrompt.userChoice
			if (outcome === 'accepted') {
				setIsInstalled(true)
				setBannerState('hidden')
			}
			setDeferredPrompt(null)
		} else if (isIOS) {
			// Show iOS step-by-step guide
			setBannerState('guide-ios')
		} else {
			// Show Android/Chrome manual install guide
			setBannerState('guide-android')
		}
	}

	const handleDismiss = () => {
		setBannerState('hidden')
		sessionStorage.setItem('pwa_banner_dismissed', 'true')
	}

	if (isInstalled || bannerState === 'hidden') return null

	// --- Android manual guide panel ---
	if (bannerState === 'guide-android') {
		return (
			<div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-900/97 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-orange-500/40 z-50 animate-in slide-in-from-bottom duration-300">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center">
							<Fuel className="w-4 h-4 text-white" />
						</div>
						<span className="text-sm font-bold text-white">Cara Pasang di Android</span>
					</div>
					<button
						onClick={handleDismiss}
						className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="space-y-2.5">
					{[
						{ step: '1', text: 'Ketuk ikon titik tiga (⋮) di sudut kanan atas Chrome' },
						{ step: '2', text: 'Pilih "Tambahkan ke layar utama" atau "Instal Aplikasi"' },
						{ step: '3', text: 'Ketuk "Tambah" / "Instal" pada dialog konfirmasi' },
						{ step: '4', text: 'Aplikasi Gasoline siap dipakai dari layar utama HP! 🎉' },
					].map(({ step, text }) => (
						<div key={step} className="flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
								<span className="text-[11px] font-bold text-orange-400">{step}</span>
							</div>
							<p className="text-[12px] text-slate-200 leading-snug">{text}</p>
						</div>
					))}
				</div>

				<button
					onClick={() => setBannerState('banner')}
					className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
				>
					<ChevronRight className="w-3.5 h-3.5 rotate-180" />
					Kembali
				</button>
			</div>
		)
	}

	// --- iOS guide panel ---
	if (bannerState === 'guide-ios') {
		return (
			<div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-900/97 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 z-50 animate-in slide-in-from-bottom duration-300">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center">
							<Fuel className="w-4 h-4 text-white" />
						</div>
						<span className="text-sm font-bold text-white">Cara Pasang di iPhone/iPad</span>
					</div>
					<button
						onClick={handleDismiss}
						className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="space-y-2.5">
					{[
						{ step: '1', text: 'Buka di Safari (bukan Chrome/Firefox)' },
						{
							step: '2',
							text: 'Ketuk ikon Bagikan (kotak dengan panah ke atas ↑) di bawah layar',
						},
						{ step: '3', text: 'Scroll ke bawah, ketuk "Tambahkan ke Layar Utama"' },
						{ step: '4', text: 'Ketuk "Tambahkan" di pojok kanan atas — selesai! 🎉' },
					].map(({ step, text }) => (
						<div key={step} className="flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
								<span className="text-[11px] font-bold text-blue-400">{step}</span>
							</div>
							<p className="text-[12px] text-slate-200 leading-snug">{text}</p>
						</div>
					))}
				</div>

				<button
					onClick={() => setBannerState('banner')}
					className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
				>
					<ChevronRight className="w-3.5 h-3.5 rotate-180" />
					Kembali
				</button>
			</div>
		)
	}

	// --- Default banner ---
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
				<button
					onClick={handleInstallClick}
					className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
				>
					{isIOS ? (
						<>
							<Share className="w-4 h-4" />
							<span>Cara Pasang di iPhone</span>
						</>
					) : deferredPrompt ? (
						<>
							<Smartphone className="w-4 h-4" />
							<span>Instal 1-Klik</span>
						</>
					) : (
						<>
							<ChevronRight className="w-4 h-4" />
							<span>Cara Pasang di Android</span>
						</>
					)}
				</button>
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
