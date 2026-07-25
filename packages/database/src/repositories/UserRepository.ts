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

export const userRepository = {
	async findUserByEmail(email: string): Promise<UserRow | null> {
		const res = await query<UserRow>(
			`SELECT id, name, email, role FROM common.users WHERE email = $1 LIMIT 1`,
			[email],
		)
		return res.rows[0] || null
	},

	async upsertUser(data: {
		name: string
		email: string
		password?: string
		role?: string
	}): Promise<UserRow> {
		const role = data.role || 'CUSTOMER'
		const password = data.password || ''

		const res = await query<UserRow>(
			`INSERT INTO common.users (name, email, password, role, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         updated_at = NOW()
       RETURNING id, name, email, role`,
			[data.name, data.email, password, role],
		)

		return res.rows[0]
	},
}
