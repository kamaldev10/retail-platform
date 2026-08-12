import { NextResponse } from 'next/server'
import manifest from '../manifest'

export const dynamic = 'force-static'

export async function GET() {
	const manifestData = manifest()
	return NextResponse.json(manifestData, {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'public, max-age=86400, s-maxage=86400',
		},
	})
}
