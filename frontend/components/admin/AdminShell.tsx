'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bars, History, ThLarge, Times, User, Users, VolumeUp } from '@primeicons/react';
import { clearSession, getSessionUser, getToken } from '../../lib/auth';

const NAV = [
  { href: '/admin', label: "Vue d'ensemble", Icon: ThLarge, exact: true },
  { href: '/admin/artistes', label: 'Artistes', Icon: Users },
  { href: '/admin/selection', label: 'Publications', Icon: VolumeUp },
  { href: '/admin/journal', label: 'Journal', Icon: History },
  { href: '/admin/profil', label: 'Profil', Icon: User },
];

type Gate = 'loading' | 'ok' | 'forbidden';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('loading');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const token = getToken();
    const session = getSessionUser();
    if (!token || !session) {
      router.replace('/connexion');
      return;
    }
    if (session.role !== 'admin') {
      setGate('forbidden');
      return;
    }
    setAdminName(session.fullName || 'Admin');
    setGate('ok');
  }, [router, pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  function closeMenu() {
    setMobileOpen(false);
  }

  function logout() {
    clearSession();
    closeMenu();
    router.replace('/connexion');
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="admin-brand">
          <span className="admin-brand-mark">A</span>
          <div>
            <p className="admin-brand-title">Amani</p>
            <p className="admin-brand-sub">Administration</p>
          </div>
          <button
            type="button"
            className="admin-sidebar-close"
            aria-label="Fermer le menu"
            onClick={closeMenu}
          >
            <Times size={16} />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${active ? 'is-active' : ''}`}
                onClick={closeMenu}
              >
                <span className="admin-nav-icon" aria-hidden>
                  <item.Icon size={16} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-foot">
          <p className="admin-user">{adminName}</p>
          <div className="admin-foot-links">
            <Link href="/" onClick={closeMenu}>
              Site public
            </Link>
            <Link href="/admin/profil" onClick={closeMenu}>
              Profil
            </Link>
            <button type="button" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-backdrop"
          aria-label="Fermer le menu"
          onClick={closeMenu}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
          >
            <Bars size={18} />
            <span>Menu</span>
          </button>
          <p className="admin-topbar-title">Panel admin</p>
          <Link href="/" className="admin-topbar-link">
            Voir le site
          </Link>
        </header>

        <div className="admin-content">
          {gate === 'loading' && <p className="admin-muted">Chargement du panel…</p>}

          {gate === 'forbidden' && (
            <div className="admin-card admin-center-card">
              <h1 className="admin-h1">Accès refusé</h1>
              <p className="admin-muted mt-2">
                Cette zone est réservée à l&apos;administrateur.
              </p>
              <Link href="/" className="admin-link mt-4 inline-block">
                Retour à l&apos;accueil
              </Link>
            </div>
          )}

          {gate === 'ok' && children}
        </div>
      </div>
    </div>
  );
}
