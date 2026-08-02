'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { getToken } from '@/lib/auth';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1717278920189-f69e4697dcc1?auto=format&fit=crop&w=1400&q=80';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [tokenState, setTokenState] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (getToken()) {
      router.replace('/profil/moi');
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      setMessage('Lien manquant ou invalide.');
      return;
    }

    let cancelled = false;
    setTokenState('checking');
    setMessage('');

    void apiGet<{ valid: boolean; email: string }>(
      `/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
    )
      .then((res) => {
        if (cancelled) return;
        if (res.valid) {
          setTokenState('valid');
          setMaskedEmail(res.email || '');
        } else {
          setTokenState('invalid');
          setMessage('Lien expiré ou invalide. Demande un nouveau lien.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTokenState('invalid');
        setMessage(err instanceof Error ? err.message : 'Lien expiré ou invalide.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tokenState !== 'valid') {
      setStatus('error');
      setMessage('Token non valide. Demande un nouveau lien.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await apiPost<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      setStatus('done');
      setMessage(res.message);
      setTimeout(() => router.replace('/connexion'), 1600);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Réinitialisation impossible');
      // Token peut avoir expire entre-temps
      if (err instanceof Error && /expire|invalide/i.test(err.message)) {
        setTokenState('invalid');
      }
    }
  }

  return (
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
          <p className="mt-1.5 text-sm text-white/80">Nouveau mot de passe</p>
        </div>
      </header>

      <div className="profile-fade profile-auth-panel mx-auto w-full max-w-md px-5 pb-8 pt-5 md:max-w-lg md:pt-7">
        <h1 className="font-display text-2xl font-semibold text-[var(--amani-ink)]">
          Choisir un mot de passe
        </h1>

        {tokenState === 'checking' && (
          <p className="mt-4 text-sm text-[var(--amani-forest)]">Vérification du lien…</p>
        )}

        {tokenState === 'invalid' && (
          <div className="mt-5">
            <p className="text-sm text-[#a32d2d]">
              {message || 'Lien expiré ou invalide. Demande un nouveau lien.'}
            </p>
            <Link
              href="/mot-de-passe-oublie"
              className="mt-4 inline-block text-sm font-medium text-[var(--amani-bronze)] hover:underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        )}

        {tokenState === 'valid' && (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--amani-forest)]/80">
              Lien valide
              {maskedEmail ? (
                <>
                  {' '}
                  pour <span className="font-medium text-[var(--amani-ink)]">{maskedEmail}</span>
                </>
              ) : null}
              . Choisis un nouveau mot de passe (8 caractères min.).
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] tracking-wide text-[var(--amani-forest)]">
                  Nouveau mot de passe
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  minLength={8}
                  className="profile-input"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] tracking-wide text-[var(--amani-forest)]">
                  Confirmer
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retape le mot de passe"
                  required
                  minLength={8}
                  className="profile-input"
                />
              </label>

              <button
                type="submit"
                disabled={status === 'loading' || status === 'done'}
                className="profile-btn-primary mt-1"
              >
                {status === 'loading'
                  ? 'Enregistrement...'
                  : status === 'done'
                    ? 'Fait'
                    : 'Enregistrer'}
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
          </>
        )}

        <p className="mt-5 text-center text-xs text-[var(--amani-forest)]/75">
          <Link href="/connexion" className="font-medium text-[var(--amani-bronze)] hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="profile-page min-h-screen w-full">
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <p className="text-sm text-[var(--amani-forest)]">Chargement...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
