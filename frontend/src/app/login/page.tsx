'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Lock,
  Mail,
  Shield,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ApiClientError } from '@/services/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const user = await login({ email, password });
      if (user.roles?.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/garasi-saya');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Login gagal. Periksa email dan kata sandi Anda.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = async (role: 'user' | 'admin') => {
    const demoEmail =
      role === 'admin' ? 'admin@motolens.id' : 'user@motolens.id';
    const demoPassword = 'Password123!';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const user = await login({ email: demoEmail, password: demoPassword });
      if (user.roles?.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/garasi-saya');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Gagal masuk dengan akun demo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Bike className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Masuk ke MotoLens
          </h1>
          <p className="text-xs text-slate-500">
            Kelola garasi, ajukan jadwal survei fisik, dan jalankan inspeksi AI
          </p>
        </div>

        {/* Demo Quick Login Box (PRD Bab 11.5) */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
          <p className="text-xs font-bold text-indigo-950 text-center">
            Akses Cepat Pengujian Capstone (Demo Login)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDemoFill('user')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-2xs"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Demo User</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDemoFill('admin')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@motolens.id"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <span>Masuk Sekarang</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Belum memiliki akun MotoLens?{' '}
          <Link
            href="/register"
            className="font-bold text-indigo-600 hover:underline"
          >
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}
