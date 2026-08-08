import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Gasoline Web Retail',
		short_name: 'Gasoline',
		description: 'Aplikasi Eceran BBM & Minipump — Offline-first stok & pencatatan kas',
		start_url: '/',
		display: 'standalone',
		orientation: 'portrait',
		background_color: '#0f172a',
		theme_color: '#f97316',
		icons: [
			{
				src: '/icons/icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/icons/icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/icons/icon.svg',
				sizes: '512x512',
				type: 'image/svg+xml',
				purpose: 'any',
			},
		],
		shortcuts: [
			{
				name: 'Input Shift Baru',
				short_name: 'Shift',
				description: 'Buka pencatatan shift operasional BBM',
				url: '/shift',
				icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
			},
			{
				name: 'Katalog Produk',
				short_name: 'Katalog',
				description: 'Kelola daftar produk botol eceran & harga',
				url: '/catalog',
				icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
			},
			{
				name: 'Laporan Kas',
				short_name: 'Kas',
				description: 'Ringkasan pemasukan & pengeluaran kasir',
				url: '/report',
				icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
			},
		],
	}
}
