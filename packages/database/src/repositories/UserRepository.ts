import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { query } from '../connection'

export interface UserRow {
	id: string
	name: string
	email: string
	password?: string
	role: string
	created_at?: Date
	updated_at?: Date
}

/**
 * Hashes a plaintext password using Node.js built-in scrypt algorithm.
 */
export function hashPassword(password: string): string {
	if (!password) return ''
	if (password.startsWith('$scrypt$')) return password
	const salt = randomBytes(16).toString('hex')
	const derivedKey = scryptSync(password, salt, 64).toString('hex')
	return `$scrypt$v=1$${salt}$${derivedKey}`
}

/**
 * Verifies a plaintext password against an scrypt hash or fallback string.
 */
export function verifyPassword(password: string, hash: string): boolean {
	if (!password || !hash) return false
	if (!hash.startsWith('$scrypt$')) {
		// Fallback for unhashed legacy passwords
		return password === hash
	}
	const parts = hash.split('$')
	if (parts.length !== 4) return false
	const salt = parts[2]
	const storedKey = parts[3]
	const derivedKey = scryptSync(password, salt, 64).toString('hex')
	try {
		return timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(storedKey, 'hex'))
	} catch {
		return false
	}
}

export const userRepository = {
	async findUserByEmail(email: string): Promise<UserRow | null> {
		const res = await query<UserRow>(
			`SELECT id, name, email, password, role FROM common.users WHERE email = $1 LIMIT 1`,
			[email],
		)
		return res.rows[0] || null
	},

	async verifyUserPassword(
		email: string,
		plaintextPassword: string,
	): Promise<{ success: boolean; user?: UserRow; message?: string }> {
		const user = await this.findUserByEmail(email)
		if (!user) {
			return { success: false, message: 'Pengguna tidak ditemukan.' }
		}
		if (!user.password || !verifyPassword(plaintextPassword, user.password)) {
			return { success: false, message: 'Password tidak sesuai.' }
		}
		return { success: true, user }
	},

	async upsertUser(data: {
		name: string
		email: string
		password?: string
		role?: string
	}): Promise<UserRow> {
		const role = data.role || 'CUSTOMER'
		const rawPassword = data.password || ''
		const hashedPassword = hashPassword(rawPassword)

		const res = await query<UserRow>(
			`INSERT INTO common.users (name, email, password, role, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         updated_at = NOW()
       RETURNING id, name, email, role`,
			[data.name, data.email, hashedPassword, role],
		)

		return res.rows[0]
	},
}
