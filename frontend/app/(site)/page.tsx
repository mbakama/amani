import Link from 'next/link';
import ArtistAvatar from '@/components/ArtistAvatar';
import HomeHero from '@/components/home/HomeHero';
import HomeSection from '@/components/home/HomeSection';
import HomeWorkCard from '@/components/home/HomeWorkCard';
import HomePublications from '@/components/home/HomePublications';
import { apiGet, type Work, type EventItem } from '@/lib/api';

const TYPE_HINT: Record<Work['type'], string> = {
  music: 'Musique',
  slam: 'Slam & Poésie',
  poem: 'Poésie',
};

export default async function HomePage() {
  const [featured, recent, events] = await Promise.all([
    apiGet<Work[]>('/works/featured').catch(() => []),
    apiGet<Work[]>('/works').catch(() => []),
    apiGet<EventItem[]>('/events').catch(() => []),
  ]);

  const liveNow = events.find((e) => e.isLiveNow);

  type ArtistCard = {
    id: string;
    fullName: string;
    city?: string;
    hint: string;
  };

  const artists = Array.from(
    new Map(
      recent.map((w) => {
        const hint = w.style?.trim() || TYPE_HINT[w.type];
        return [
          w.artist.id,
          {
            id: w.artist.id,
            fullName: w.artist.fullName,
            city: w.artist.city,
            hint,
          } satisfies ArtistCard,
        ] as const;
      }),
    ).values(),
  ).slice(0, 8);

  const featuredIds = new Set(featured.map((w) => w.id));
  const nouveautes = recent.filter((w) => !featuredIds.has(w.id)).slice(0, 12);

  return (
    <main className="home-page">
      <HomeHero />

      {liveNow && (
        <HomeSection title="En direct" eyebrow="Live">
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--amani-forest)]/12 bg-white px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6 md:py-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="home-live-dot" aria-hidden />
                <span className="text-xs uppercase tracking-wider text-[#c44b3a]">Live</span>
              </div>
              <p className="font-display text-xl font-medium text-[var(--amani-ink)] md:text-2xl">
                {liveNow.title}
              </p>
              <p className="mt-1 text-sm text-[var(--amani-forest)]">{liveNow.city}</p>
            </div>
            <Link
              href="/evenements"
              className="inline-flex w-fit rounded-full bg-[var(--amani-forest)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#163d30]"
            >
              Rejoindre
            </Link>
          </div>
        </HomeSection>
      )}

      {artists.length > 0 && (
        <HomeSection
          eyebrow="Inspiration"
          title="Artistes à découvrir"
          subtitle="Talents émergents de la scène locale"
          action={{ href: '/#nouveautes', label: 'Tout voir' }}
        >
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 md:gap-8 md:overflow-visible md:pb-0">
            {artists.map((a, index) => (
              <Link
                key={a.id}
                href={`/profil/${a.id}`}
                className="group flex w-[4.25rem] flex-shrink-0 flex-col items-center gap-1.5 md:w-[6.5rem] md:gap-2"
              >
                <span
                  className={`rounded-full p-[2px] transition md:p-[3px] ${
                    index === 0
                      ? 'bg-[var(--amani-forest)]'
                      : 'bg-transparent group-hover:bg-[rgba(30,77,61,0.2)]'
                  }`}
                >
                  <span className="block rounded-full bg-white p-[2px]">
                    <span className="md:hidden">
                      <ArtistAvatar name={a.fullName} size={56} />
                    </span>
                    <span className="hidden md:block">
                      <ArtistAvatar name={a.fullName} size={88} />
                    </span>
                  </span>
                </span>
                <span className="w-full truncate text-center text-[11px] font-semibold leading-tight text-[var(--amani-ink)] md:text-sm">
                  <span className="md:hidden">{a.fullName.split(' ')[0]}</span>
                  <span className="hidden md:inline">{a.fullName}</span>
                </span>
                <span className="hidden w-full truncate text-center text-[11px] text-[rgba(20,32,28,0.5)] md:block">
                  {a.hint}
                </span>
              </Link>
            ))}
          </div>
        </HomeSection>
      )}

      {featured.length > 0 && (
        <HomeSection
          eyebrow="Sélection"
          title="Sélection de la semaine"
          subtitle="Mises en avant par l'équipe Amani"
          action={{ href: '/#nouveautes', label: 'Tout voir' }}
        >
          <div className="flex flex-col gap-3">
            {featured.map((w) => (
              <HomeWorkCard key={w.id} work={w} />
            ))}
          </div>
        </HomeSection>
      )}

      <HomeSection
        id="nouveautes"
        eyebrow="Nouveautés"
        title="Dernières publications"
        subtitle="Les dernières sorties de la semaine"
      >
        {nouveautes.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE8E2] bg-white px-5 py-8 text-sm text-[rgba(20,32,28,0.6)]">
            Aucune œuvre publiée pour le moment. Les artistes validés peuvent publier depuis
            l&apos;onglet Publier.
          </div>
        ) : (
          <HomePublications works={nouveautes} />
        )}
      </HomeSection>
    </main>
  );
}
