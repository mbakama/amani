'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/profile/AuthPanel';
import { getSessionUser, getToken } from '@/lib/auth';

function redirectAfterAuth(router: ReturnType<typeof useRouter>) {
  const session = getSessionUser();
  router.replace(session?.role === 'admin' ? '/admin' : '/profil/moi');
}

export default function InscriptionPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      redirectAfterAuth(router);
      return;
    }
    setReady(true);
  }, [router]);

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
        <AuthPanel mode="register" onSuccess={() => redirectAfterAuth(router)} />
      </div>
    </main>
  );
}
