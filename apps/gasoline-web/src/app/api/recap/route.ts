import { NextResponse } from 'next/server'
import { gasolineRecapRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export async function GET() {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const recaps = await gasolineRecapRepository.findAllRecaps()
		return NextResponse.json(recaps)
	} catch (error) {
		console.error('Failed to fetch gasoline recaps:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
