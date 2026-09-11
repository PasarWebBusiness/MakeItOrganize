'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectCalendar, setConnectCalendar] = useState(true);

  useEffect(() => {
    const googleError = new URLSearchParams(window.location.search).get('google_error');
    if (!googleError) return;
    const messages: Record<string, string> = {
      cancelled: 'Proses masuk dengan Google dibatalkan.',
      configuration: 'Google OAuth belum dikonfigurasi pada environment ini.',
      invalid_state: 'Sesi Google OAuth tidak valid atau sudah kedaluwarsa. Silakan coba lagi.',
      link_required: 'Email ini sudah terdaftar. Masuk dengan password lalu hubungkan Google dari Settings.',
      provider: 'Google menolak permintaan autentikasi.',
      failed: 'Masuk dengan Google gagal. Silakan coba lagi.',
    };
    const timer = window.setTimeout(() => setError(messages[googleError] ?? messages.failed), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const { loginAction } = await import('../actions');
      const res = await loginAction(formData);
      
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        // Next.js redirect throws an error to halt execution, this is expected
        return;
      }
      setError('Terjadi kesalahan yang tidak terduga.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="auth-brand-mark">
          <Check size={18} strokeWidth={3} />
        </span>
        <span className="auth-brand-name">MakeItOrganize</span>
      </div>

      <div className="auth-heading">
        <h1>Selamat datang kembali</h1>
        <p>Masuk untuk melanjutkan ke workspace-mu.</p>
      </div>

      <button
        className="google-btn"
        type="button"
        onClick={() => window.location.assign(
          connectCalendar
            ? '/api/auth/google/start?calendar=1&returnTo=/?view=calendar'
            : '/api/auth/google/start?returnTo=/',
        )}
        aria-label="Masuk dengan Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Masuk dengan Google
      </button>
      <label
        className="auth-google-option"
        htmlFor="login-connect-calendar"
        aria-label="Sesuaikan Google Calendar setelah masuk"
      >
        <input
          id="login-connect-calendar"
          type="checkbox"
          checked={connectCalendar}
          onChange={(event) => setConnectCalendar(event.target.checked)}
        />
        <span>
          <strong>Sesuaikan Google Calendar setelah masuk</strong>
          <small>Meminta akses baca kalender dari akun Google yang kamu pilih.</small>
        </span>
      </label>

      <div className="auth-divider">
        <span>atau masuk dengan email</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="auth-field">
          <div className="auth-field-head">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password" className="auth-link-small">
              Lupa password?
            </Link>
          </div>
          <div className="auth-input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="auth-spinner" /> Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </button>
      </form>

      <p className="auth-footer-link">
        Belum punya akun?{' '}
        <Link href="/register" className="auth-link">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
