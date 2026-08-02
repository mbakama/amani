import Link from 'next/link';
import ProfileView from '@/components/profile/ProfileView';
import { apiGet, type UserProfile } from '@/lib/api';

// Profil public d'un artiste — voir cahier des charges section 3.2
export default async function ProfilePage({ params }: { params: { id: string } }) {
  if (params.id === 'moi') {
    return null;
  }

  try {
    const artist = await apiGet<UserProfile>(`/users/${params.id}`);
    return (
      <main className="profile-page min-h-screen w-full">
        <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl">
          <ProfileView profile={artist} />
        </div>
      </main>
    );
  } catch {
    return (
      <main className="profile-page min-h-screen w-full">
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <p className="font-display text-3xl text-[var(--amani-ink)]">Amani</p>
          <p className="mt-4 text-sm text-[var(--amani-forest)]">Profil introuvable.</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-[var(--amani-bronze)] underline-offset-4 hover:underline"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }
}
