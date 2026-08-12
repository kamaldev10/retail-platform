import React from 'react'
import type { Metadata, Viewport } from 'next'
import { MobileLayout } from '@/components/common/MobileLayout'
import { SWRegistration } from '@/components/common/SWRegistration'
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
	title: 'Gasoline Web Operator — Retail BBM',
	description: 'Aplikasi Eceran BBM & Minipump — Stok & pencatatan kas terpusat',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Gasoline',
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: '#f97316',
	viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="id">
			<head>
				{/* PWA Manifest — served as static file from /public/manifest.json */}
				<link rel="manifest" href="/manifest.json" />

				{/* Favicon & home screen icons */}
				<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />

				{/* iOS Safari */}
				<link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
				<link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="Gasoline" />

				{/* Android Chrome */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="application-name" content="Gasoline" />
			</head>
			<body className="antialiased overflow-hidden select-none">
				<SWRegistration />
				<Toaster position="top-center" richColors />
				<MobileLayout>{children}</MobileLayout>
				<PWAInstallPrompt />
			</body>
		</html>
	)
}
