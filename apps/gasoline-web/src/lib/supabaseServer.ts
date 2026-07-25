import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { userRepository } from '@retail/database'

export async function createClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options)
						})
					} catch (error) {
						// Can be ignored if called from Server Component
					}
				},
			},
		},
	)
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options)
						})
					} catch (error) {
						// Can be ignored if called from Server Component
					}
				},
			},
		},
	)
}

export async function checkAdminAccess() {
	try {
		const supabase = await createClient()
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser()

		if (error || !user || !user.email) {
			return { authorized: false, error: 'Unauthorized: No active session' }
		}

		// Check role in our PostgreSQL database using Raw SQL repository
		const dbUser = await userRepository.findUserByEmail(user.email)

		if (!dbUser || dbUser.role !== 'ADMIN') {
			return { authorized: false, error: 'Forbidden: Access restricted to Admin only' }
		}
		if (!dbUser || dbUser.role !== 'ADMIN') {
			return { authorized: false, error: 'Forbidden: Access restricted to Admin only' }
		}

		return { authorized: true, user, dbUser }
	} catch (error) {
		console.error('Admin authorization check failed:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		return { authorized: false, error: errorMessage }
	}
		return { authorized: true, user, dbUser }
	} catch (error) {
		console.error('Admin authorization check failed:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		return { authorized: false, error: errorMessage }
	}
}
