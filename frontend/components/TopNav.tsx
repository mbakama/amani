'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSessionUser, getToken, type SessionUser } from '../lib/auth';

// Navigation desktop — le bottom nav reste pour mobile.
// Sur l'accueil : transparente sur le hero, fond solide une fois le scroll demarre.
export default function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setSession(getSessionUser());
    setLoggedIn(Boolean(getToken()));
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const profileHref = loggedIn ? '/profil/moi' : '/connexion';
  const profileLabel = loggedIn ? 'Profil' : 'Connexion';
  const ghost = isHome && !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 hidden md:block transition-colors duration-200 ${
        ghost
          ? 'border-transparent bg-transparent'
          : 'border-b border-line bg-surface/95 backdrop-blur'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Amani — Accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-nav.png"
            alt="Amani"
            className={`h-14 w-auto object-contain object-left md:h-16 ${
              ghost ? 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]' : ''
            }`}
          />
        </Link>
        <nav className={`flex items-center gap-8 text-sm ${ghost ? 'text-white/70' : 'text-muted'}`}>
          <Link href="/" className={ghost ? 'text-white' : 'text-ink'}>
            Accueil
          </Link>
          <Link href="/evenements" className={ghost ? 'hover:text-white' : 'hover:text-ink'}>
            Événements
          </Link>
          <Link href="/publier" className={ghost ? 'hover:text-white' : 'hover:text-ink'}>
            Publier
          </Link>
          <Link href={profileHref} className={ghost ? 'hover:text-white' : 'hover:text-ink'}>
            {profileLabel}
          </Link>
          {!loggedIn && (
            <Link
              href="/inscription"
              className={ghost ? 'text-white' : 'text-[var(--amani-bronze)]'}
            >
              Inscription
            </Link>
          )}
          {session?.role === 'admin' && (
            <Link
              href="/admin"
              className={ghost ? 'text-white' : 'text-[var(--amani-bronze)]'}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
