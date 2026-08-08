'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

	if (!url || !key) {
		console.error(
			'⚠️ Supabase environment variables missing! Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment settings.',
		)
	}

	return createBrowserClient(url, key)
}
