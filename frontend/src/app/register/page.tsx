'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ApiClientError } from '@/services/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name,
        email,
        phone_whatsapp: phoneWhatsapp,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push('/garasi-saya');
    } catch (err) {
      if (err instanceof ApiClientError) {
        const firstFieldErr = err.errors
          ? Object.values(err.errors).flat()[0]
          : null;
        setErrorMsg(firstFieldErr || err.message);
      } else {
        setErrorMsg('Pendaftaran gagal. Silakan periksa kembali data Anda.');
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
            Daftar Akun MotoLens
          </h1>
          <p className="text-xs text-slate-500">
            Akun publik otomatis terdaftar dengan peran Member (Pembeli &
            Penjual)
          </p>
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
              htmlFor="reg-name"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Nama Lengkap
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="I Made Wirawan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Nomor WhatsApp Aktif
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-phone"
                type="tel"
                required
                value={phoneWhatsapp}
                onChange={(e) => setPhoneWhatsapp(e.target.value)}
                placeholder="081234567890"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Kata Sandi (Min. 8 Karakter)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password-confirm"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-password-confirm"
                type="password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <span>Daftar Sekarang</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Sudah memiliki akun?{' '}
          <Link
            href="/login"
            className="font-bold text-indigo-600 hover:underline"
          >
            Masuk di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}
