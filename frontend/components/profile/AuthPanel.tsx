'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { apiPost, type AuthResponse } from '../../lib/api';
import { setSession } from '../../lib/auth';
import GoogleSignInButton, { isGoogleConfigured } from './GoogleSignInButton';

export type AuthMode = 'login' | 'register';
type AccountType = 'visitor' | 'artist';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1717278920189-f69e4697dcc1?auto=format&fit=crop&w=1400&q=80';

export default function AuthPanel({
  mode,
  onSuccess,
}: {
  mode: AuthMode;
  onSuccess: () => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>('visitor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [verificationReference, setVerificationReference] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const googleEnabled = isGoogleConfigured();

  const handleGoogleError = useCallback((message: string) => {
    setStatus('error');
    setError(message);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      if (mode === 'register') {
        await apiPost('/users/register', {
          email,
          password,
          fullName,
          role: accountType,
          ...(accountType === 'artist'
            ? { city, discipline, verificationReference }
            : {}),
        });
      }

      const auth = await apiPost<AuthResponse>('/auth/login', { email, password });
      setSession(auth);
      setStatus('idle');
      onSuccess();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
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
          <img
            src={AUTH_IMAGE}
            alt="Jeune femme chantant au micro"
            className="profile-auth-hero-img"
          />
        </picture>
        <div className="profile-auth-hero-scrim" />
        <div className="profile-auth-hero-copy">
          <Link href="/" className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Amani
          </Link>
          <p className="mt-1.5 text-sm text-white/80">
            {mode === 'login' ? 'Bon retour parmi nous.' : 'Rejoins la création.'}
          </p>
        </div>
      </header>

      <div className="profile-fade profile-auth-panel mx-auto w-full max-w-md px-5 pb-8 pt-5 md:max-w-lg md:pt-7">
        <div className="mb-5 flex">
          <Link href="/connexion" className={`profile-tab text-center ${mode === 'login' ? 'is-active' : ''}`}>
            Connexion
          </Link>
          <Link
            href="/inscription"
            className={`profile-tab text-center ${mode === 'register' ? 'is-active' : ''}`}
          >
            Inscription
          </Link>
        </div>

        {googleEnabled && (
          <>
            <GoogleSignInButton onSuccess={onSuccess} onError={handleGoogleError} />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--amani-forest)]/15" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--amani-forest)]">
                ou par email
              </span>
              <div className="h-px flex-1 bg-[var(--amani-forest)]/15" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('visitor')}
                  className={`profile-chip ${accountType === 'visitor' ? 'is-active' : ''}`}
                >
                  Visiteur
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('artist')}
                  className={`profile-chip ${accountType === 'artist' ? 'is-active' : ''}`}
                >
                  Artiste
                </button>
              </div>
              <Field
                label="Nom complet"
                value={fullName}
                onChange={setFullName}
                required
                placeholder="Ex. Grace Mukendi"
              />
            </>
          )}

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="toi@email.com"
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[11px] tracking-wide text-[var(--amani-forest)]">
                Mot de passe
              </span>
              {mode === 'login' && (
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-[11px] font-medium text-[var(--amani-bronze)] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              required
              minLength={8}
              className="profile-input"
            />
          </div>

          {mode === 'register' && accountType === 'artist' && (
            <>
              <Field label="Ville" value={city} onChange={setCity} placeholder="Ex. Kinshasa" />
              <Field
                label="Discipline"
                value={discipline}
                onChange={setDiscipline}
                placeholder="Ex. guitariste, slameur, poète"
              />
              <Field
                label="Référence communautaire"
                value={verificationReference}
                onChange={setVerificationReference}
                placeholder="Assemblée locale ou contact de référence"
              />
            </>
          )}

          <button type="submit" disabled={status === 'loading'} className="profile-btn-primary mt-1">
            {status === 'loading'
              ? 'Patientez…'
              : mode === 'login'
                ? 'Se connecter'
                : 'Créer mon compte'}
          </button>

          {error && <p className="text-center text-xs text-[#a32d2d]">{error}</p>}
        </form>

        <p className="mt-5 text-center text-xs text-[var(--amani-forest)]/75">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="font-medium text-[var(--amani-bronze)] hover:underline">
                S&apos;inscrire
              </Link>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <Link href="/connexion" className="font-medium text-[var(--amani-bronze)] hover:underline">
                Se connecter
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] tracking-wide text-[var(--amani-forest)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="profile-input"
      />
    </label>
  );
}
