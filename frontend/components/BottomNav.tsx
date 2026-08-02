'use client';

import Link from 'next/link';
import { useEffect, useState, type FC } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, Home, PlusCircle, Shield, User } from '@primeicons/react';
import { getSessionUser, getToken, type SessionUser } from '../lib/auth';

type NavIcon = FC<{ size?: number | string; className?: string }>;

type NavLink = {
  href: string;
  label: string;
  Icon: NavIcon;
  isActive: (pathname: string) => boolean;
};

export default function BottomNav() {
  const pathname = usePathname() ?? '';
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setSession(getSessionUser());
    setLoggedIn(Boolean(getToken()));
  }, [pathname]);

  const isAdmin = session?.role === 'admin';

  const links: NavLink[] = [
    {
      href: '/',
      label: 'Accueil',
      Icon: Home,
      isActive: (p) => p === '/',
    },
    {
      href: '/evenements',
      label: 'Événements',
      Icon: Calendar,
      isActive: (p) => p.startsWith('/evenements'),
    },
    {
      href: '/publier',
      label: 'Publier',
      Icon: PlusCircle,
      isActive: (p) => p.startsWith('/publier'),
    },
    {
      href: !loggedIn ? '/connexion' : '/profil/moi',
      label: loggedIn ? 'Profil' : 'Connexion',
      Icon: User,
      isActive: (p) =>
        !loggedIn
          ? p === '/connexion' || p === '/inscription'
          : p.startsWith('/profil'),
    },
  ];

  const navLinks = isAdmin
    ? [
        ...links,
        {
          href: '/admin',
          label: 'Admin',
          Icon: Shield,
          isActive: (p: string) => p.startsWith('/admin'),
        },
      ]
    : links;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--amani-forest)]/10 bg-[var(--amani-paper)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md justify-around py-2">
        {navLinks.map((link) => {
          const active = link.isActive(pathname);
          return (
            <Link
              key={link.href + link.label}
              href={link.href}
              aria-label={link.label}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-2 transition ${
                active
                  ? 'text-[var(--amani-forest)]'
                  : 'text-[rgba(20,32,28,0.38)]'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  active ? 'bg-[rgba(30,77,61,0.12)]' : 'bg-transparent'
                }`}
              >
                <link.Icon size={20} />
              </span>
              <span
                className={`h-1 w-1 rounded-full transition ${
                  active ? 'bg-[var(--amani-forest)]' : 'bg-transparent'
                }`}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
