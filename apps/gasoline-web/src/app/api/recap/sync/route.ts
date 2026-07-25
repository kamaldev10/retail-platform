import { NextRequest, NextResponse } from 'next/server'
import { gasolineRecapRepository, SyncRecapInput } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const body = await request.json()
		const recaps = body.recaps as SyncRecapInput[]

		if (!Array.isArray(recaps)) {
			return NextResponse.json(
				{ error: 'Bad Request', details: 'recaps field must be an array.' },
				{ status: 400 },
			)
		}

		const syncedCount = await gasolineRecapRepository.syncBatch(recaps)

		return NextResponse.json({ success: true, syncedCount })
	} catch (error) {
		console.error('Failed to sync gasoline recaps:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
