'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileView from '@/components/profile/ProfileView';
import { apiGet, type UserProfile } from '@/lib/api';
import { clearSession, getToken, updateSessionUser } from '@/lib/auth';

export default function MyProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(
    async (accessToken: string) => {
      setLoading(true);
      setError('');
      try {
        const me = await apiGet<UserProfile>('/users/me', accessToken);
        updateSessionUser({
          id: me.id,
          fullName: me.fullName,
          role: me.role,
          verificationStatus: me.verificationStatus,
        });
        setProfile(me);
      } catch {
        clearSession();
        setProfile(null);
        router.replace('/connexion');
      } finally {
        setLoading(false);
        setReady(true);
      }
    },
    [router],
  );

  useEffect(() => {
    const existing = getToken();
    if (existing) {
      void loadProfile(existing);
    } else {
      router.replace('/connexion');
    }
  }, [loadProfile, router]);

  function handleLogout() {
    clearSession();
    setProfile(null);
    router.replace('/connexion');
  }

  return (
    <main className="profile-page min-h-screen w-full">
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl">
        {!ready || loading || !profile ? (
          <div className="px-5 py-20 text-center">
            <p className="font-display text-2xl text-[var(--amani-ink)]">Amani</p>
            <p className="mt-3 text-sm text-[var(--amani-forest)]">
              {error || 'Chargement...'}
            </p>
          </div>
        ) : (
          <ProfileView
            profile={profile}
            isSelf
            onLogout={handleLogout}
            onProfileUpdate={setProfile}
          />
        )}
      </div>
    </main>
  );
}
