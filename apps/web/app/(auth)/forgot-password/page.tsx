'use client';

import { useState } from 'react';
import { Check, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError('Email wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="auth-brand-mark">
          <Check size={18} strokeWidth={3} />
        </span>
        <span className="auth-brand-name">MakeItOrganize</span>
      </div>

      {sent ? (
        <div className="auth-success-state">
          <div className="auth-success-icon">
            <MailCheck size={28} />
          </div>
          <h1>Cek email-mu</h1>
          <p>
            Kami mengirim instruksi reset password ke{' '}
            <strong>{email}</strong>. Periksa folder spam jika tidak muncul
            dalam beberapa menit.
          </p>
          <Link href="/login" className="auth-back-link">
            <ArrowLeft size={15} /> Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <>
          <div className="auth-heading">
            <h1>Lupa password?</h1>
            <p>Masukkan email dan kami akan mengirim tautan reset.</p>
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
                autoFocus
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="auth-spinner" /> Mengirim...
                </>
              ) : (
                'Kirim tautan reset'
              )}
            </button>
          </form>

          <p className="auth-footer-link">
            <Link href="/login" className="auth-back-link">
              <ArrowLeft size={15} /> Kembali ke halaman masuk
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
