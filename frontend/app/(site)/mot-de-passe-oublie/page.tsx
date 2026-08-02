'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { getToken } from '@/lib/auth';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1717278920189-f69e4697dcc1?auto=format&fit=crop&w=1400&q=80';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resetHref, setResetHref] = useState('');

  useEffect(() => {
    if (getToken()) {
      router.replace('/profil/moi');
      return;
    }
    setReady(true);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setResetHref('');
    try {
      const res = await apiPost<{
        message: string;
        resetToken?: string;
        resetUrl?: string;
        googleOnly?: boolean;
      }>('/auth/forgot-password', { email: email.trim() });

      if (res.googleOnly) {
        setStatus('error');
        setMessage(res.message);
        return;
      }

      if (res.resetToken) {
        const localHref = `/reinitialiser-mot-de-passe?token=${encodeURIComponent(res.resetToken)}`;
        setResetHref(localHref);
        setStatus('done');
        setMessage(res.message);
        return;
      }

      setStatus('done');
      setMessage(res.message || 'Si un compte existe, un lien de réinitialisation a été préparé.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  }

  if (!ready) {
    return (
      <main className="profile-page flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--amani-forest)]">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="profile-page min-h-screen w-full">
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl">
        <div className="profile-auth-shell">
          <header className="profile-auth-hero">
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet="https://images.unsplash.com/photo-1717278920189-f69e4697dcc1?auto=format&fit=crop&w=1800&h=820&q=80&crop=faces"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AUTH_IMAGE} alt="" className="profile-auth-hero-img" />
            </picture>
            <div className="profile-auth-hero-scrim" />
            <div className="profile-auth-hero-copy">
              <Link
                href="/"
                className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl"
              >
                Amani
              </Link>
              <p className="mt-1.5 text-sm text-white/80">Mot de passe oublié</p>
            </div>
          </header>

          <div className="profile-fade profile-auth-panel mx-auto w-full max-w-md px-5 pb-8 pt-5 md:max-w-lg md:pt-7">
            <h1 className="font-display text-2xl font-semibold text-[var(--amani-ink)]">
              Réinitialiser
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--amani-forest)]/80">
              Indique l&apos;email de ton compte. Un lien avec token sera affiché pour
              modifier le mot de passe (pas d&apos;email envoyé pour le moment).
            </p>

            {status === 'done' && resetHref ? (
              <div className="mt-5 rounded-xl border border-[var(--amani-forest)]/15 bg-[rgba(30,77,61,0.06)] px-4 py-4">
                <p className="text-sm text-[var(--amani-ink)]">{message}</p>
                <Link
                  href={resetHref}
                  className="profile-btn-primary mt-4 inline-flex items-center justify-center text-center"
                >
                  Ouvrir le lien de validation
                </Link>
                <p className="mt-3 break-all text-[11px] leading-relaxed text-[var(--amani-forest)]/70">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}${resetHref}`
                    : resetHref}
                </p>
                <button
                  type="button"
                  className="mt-3 text-[11px] font-medium text-[var(--amani-bronze)] hover:underline"
                  onClick={() => {
                    setStatus('idle');
                    setResetHref('');
                    setMessage('');
                  }}
                >
                  Utiliser un autre email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] tracking-wide text-[var(--amani-forest)]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@email.com"
                    required
                    className="profile-input"
                  />
                </label>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="profile-btn-primary mt-1"
                >
                  {status === 'loading' ? 'Patientez…' : 'Générer le lien'}
                </button>

                {message && (
                  <p
                    className={`text-center text-xs ${
                      status === 'error' ? 'text-[#a32d2d]' : 'text-[var(--amani-forest)]'
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            )}

            <p className="mt-5 text-center text-xs text-[var(--amani-forest)]/75">
              <Link
                href="/connexion"
                className="font-medium text-[var(--amani-bronze)] hover:underline"
              >
                Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
