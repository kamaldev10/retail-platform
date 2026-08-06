import React from 'react'
import type { Metadata, Viewport } from 'next'
import { MobileLayout } from '@/components/common/MobileLayout'
import { SWRegistration } from '@/components/common/SWRegistration'
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt'
import './globals.css'

export const metadata: Metadata = {
	title: 'Gasoline Web Operator — Retail BBM',
	description: 'Aplikasi Eceran BBM & Minipump — Offline-first stok & pencatatan kas',
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Gasoline',
	},
	icons: {
		icon: [
			{ url: '/icons/icon.svg', type: 'image/svg+xml' },
			{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
		],
		apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
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
				<link rel="manifest" href="/manifest.json" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
			</head>
			<body className="antialiased overflow-hidden select-none">
				<SWRegistration />
				<MobileLayout>{children}</MobileLayout>
				<PWAInstallPrompt />
			</body>
		</html>
	)
}
