import { NextResponse } from 'next/server'
import manifest from '../manifest'

export const dynamic = 'force-static'

export async function GET() {
	const baseManifest = manifest()
	const fullPwaManifest = {
		...baseManifest,
		id: '/',
		scope: '/',
		start_url: '/',
		display: 'standalone',
		orientation: 'portrait',
		background_color: '#0f172a',
		theme_color: '#f97316',
		categories: ['business', 'finance', 'utilities'],
		prefer_related_applications: false,
		icons: [
			{
				src: '/icons/icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any maskable',
			},
			{
				src: '/icons/icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any maskable',
			},
			{
				src: '/icons/icon.svg',
				sizes: '512x512',
				type: 'image/svg+xml',
				purpose: 'any',
			},
		],
	}

	return NextResponse.json(fullPwaManifest, {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'public, max-age=86400, s-maxage=86400',
		},
	})
}
