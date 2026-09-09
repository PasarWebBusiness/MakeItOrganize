'use client';

import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setError('Email wajib diisi.');
      return;
    }
    setError(
      'Reset password belum tersedia. Hubungi administrator workspace untuk bantuan akun.',
    );
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="auth-brand-mark">
          <Check size={18} strokeWidth={3} />
        </span>
        <span className="auth-brand-name">MakeItOrganize</span>
      </div>

      <>
        <div className="auth-heading">
          <h1>Lupa password?</h1>
          <p>
            Masukkan email untuk memeriksa ketersediaan pemulihan akun.
          </p>
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" className="auth-submit">
            Periksa pemulihan akun
          </button>
        </form>

        <p className="auth-footer-link">
          <Link href="/login" className="auth-back-link">
            <ArrowLeft size={15} /> Kembali ke halaman masuk
          </Link>
        </p>
      </>
    </div>
  );
}
