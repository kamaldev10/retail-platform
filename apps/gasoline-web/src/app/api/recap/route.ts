import { NextRequest, NextResponse } from 'next/server'
import { gasolineRecapRepository } from '@retail/database'
import { checkAdminAccess } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

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

export async function DELETE(request: NextRequest) {
	try {
		const auth = await checkAdminAccess()
		if (!auth.authorized) {
			return NextResponse.json(
				{ error: 'Unauthorized', details: auth.error },
				{ status: auth.error?.includes('Forbidden') ? 403 : 401 },
			)
		}

		const { searchParams } = new URL(request.url)
		const date = searchParams.get('date')

		if (!date) {
			return NextResponse.json({ error: 'Parameter tanggal (date) wajib diisi' }, { status: 400 })
		}

		const success = await gasolineRecapRepository.deleteRecapByDate(date)
		if (!success) {
			return NextResponse.json(
				{ error: 'Data rekap tidak ditemukan untuk tanggal tersebut' },
				{ status: 404 },
			)
		}

		return NextResponse.json({ success: true, message: `Rekap tanggal ${date} berhasil dihapus` })
	} catch (error) {
		console.error('Failed to delete gasoline recap:', error)
		const details = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 })
	}
}
