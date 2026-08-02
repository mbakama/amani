'use client';

import { useEffect, useRef, useState } from 'react';
import { apiPost, type AuthResponse } from '../../lib/api';
import { setSession } from '../../lib/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    async function handleCredential(response: { credential?: string }) {
      if (!response.credential) {
        onError('Connexion Google annulée');
        return;
      }
      try {
        const auth = await apiPost<AuthResponse>('/auth/google', {
          idToken: response.credential,
        });
        setSession(auth);
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Connexion Google échouée');
      }
    }

    function init() {
      if (cancelled || !btnRef.current || !window.google) return;
      const width = Math.min(btnRef.current.offsetWidth || 320, 400);
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        ux_mode: 'popup',
      });
      btnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
      setReady(true);
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT}"]`);
    if (existing && window.google) {
      init();
    } else if (existing) {
      existing.addEventListener('load', init);
    } else {
      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  // Pas de message technique visible aux utilisateurs si Google n'est pas configure
  if (!CLIENT_ID) return null;

  return (
    <div className="w-full">
      <div ref={btnRef} className="flex min-h-[44px] w-full justify-center overflow-hidden [&>div]:!w-full" />
      {!ready && (
        <p className="py-2 text-center text-[11px] text-[var(--amani-forest)]">Chargement Google...</p>
      )}
    </div>
  );
}

export function isGoogleConfigured() {
  return Boolean(CLIENT_ID);
}
