"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabaseClient";
import { loginSchema, LoginFormData } from "@/lib/schemas/gasoline";
import { Loader2, Lock, Mail, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Email atau password salah."
            : error.message,
        );
        setIsSubmitting(false);
        return;
      }

      // Check if session refreshed successfully
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg("Gagal memuat sesi pengguna.");
        setIsSubmitting(false);
        return;
      }

      // Successful login, redirect to dashboard
      router.refresh();
      router.push("/");
    } catch (err) {
      setErrorMsg("Terjadi kesalahan koneksi database.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-400 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-white">
        {/* Brand/Logo */}
        <div className="flex flex-col items-center gap-2 text-center mt-2">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-orange-500/20">
            ⛽
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-100">
              Gasoline Web Eceran
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Portal Inventaris & Keuangan Admin
            </p>
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
            <label
              htmlFor="login-email"
              className="text-xs font-bold text-slate-300"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                id="login-email"
                type="email"
                placeholder="admin@retail.com"
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "login-email-error" : undefined
                }
                {...register("email")}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
            <label
              htmlFor="login-password"
              className="text-xs font-bold text-slate-300"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                {...register("password")}
                className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
                title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengautentikasi...
              </>
            ) : (
              "Masuk ke Sistem"
            )}
          </button>
        </form>

        <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-4 mt-1 font-medium">
          Akses dibatasi hanya untuk Akun dengan status <strong>ADMIN</strong>
        </div>
      </div>
    </div>
  );
}
