'use client'

import { LoginFormData, loginSchema } from '@/lib/schemas/gasoline'
import { createClient } from '@/lib/supabaseClient'
import { withTimeout } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Eye, EyeOff, Fuel, Loader2, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const AUTH_TIMEOUT_MS = 20_000

export default function LoginPage() {
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: LoginFormData) => {
		setIsSubmitting(true)
		setErrorMsg(null)

		try {
			const supabase = createClient()
			const { data: authData, error } = await withTimeout(
				supabase.auth.signInWithPassword({
					email: data.email,
					password: data.password,
				}),
				AUTH_TIMEOUT_MS,
				'Timeout menghubungi server autentikasi. Cek koneksi internet lalu coba lagi.',
			)

			if (error) {
				setErrorMsg(
					error.message === 'Invalid login credentials'
						? 'Email atau password salah.'
						: error.message,
				)
				return
			}

			if (!authData.session) {
				setErrorMsg('Gagal membuat sesi login.')
				return
			}

			// Full navigation so middleware/cookies pick up the new session
			window.location.assign('/')
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi autentikasi.'
			setErrorMsg(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="h-full w-full flex flex-col justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-y-auto">
			<div className="w-full max-w-sm mx-auto bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
				{/* Brand/Logo */}
				<div className="flex flex-col items-center gap-2 text-center mt-2">
					<div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/20">
						<Fuel className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-lg font-black tracking-tight text-slate-100">
							Gasoline Web Eceran
						</h1>
						<p className="text-xs text-slate-400 mt-0.5">Portal Inventaris & Keuangan Admin</p>
					</div>
				</div>

				{errorMsg && (
					<div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3 flex gap-2.5 text-xs text-red-300 font-semibold items-start">
						<AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
						<span>{errorMsg}</span>
					</div>
				)}

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					{/* Email field */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="login-email" className="text-xs font-bold text-slate-300">
							Alamat Email
						</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								id="login-email"
								type="email"
								placeholder="admin@retail.com"
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? 'login-email-error' : undefined}
								{...register('email')}
								className="w-full pl-9 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							/>
						</div>
						{errors.email && (
							<span
								id="login-email-error"
								className="text-[10px] text-red-400 font-semibold mt-0.5"
							>
								{errors.email.message}
							</span>
						)}
					</div>

					{/* Password field */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="login-password" className="text-xs font-bold text-slate-300">
							Kata Sandi
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								id="login-password"
								type={showPassword ? 'text' : 'password'}
								placeholder="••••••••"
								aria-invalid={!!errors.password}
								aria-describedby={errors.password ? 'login-password-error' : undefined}
								{...register('password')}
								className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
								title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
							>
								{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							</button>
						</div>
						{errors.password && (
							<span
								id="login-password-error"
								className="text-[10px] text-red-400 font-semibold mt-0.5"
							>
								{errors.password.message}
							</span>
						)}
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 h-12"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Mengautentikasi...
							</>
						) : (
							'Masuk ke Sistem'
						)}
					</button>
				</form>

				<div className="text-[10px] text-slate-500 text-center border-t border-white/10 pt-4 mt-1 font-medium">
					Akses dibatasi hanya untuk Akun dengan status <strong>ADMIN</strong>
				</div>
			</div>
		</div>
	)
}
