import Link from 'next/link';
import HomeHeroCarousel from './HomeHeroCarousel';

export default function HomeHero() {
  return (
    <section className="home-hero relative isolate w-full overflow-hidden text-white">
      <HomeHeroCarousel />

      <div className="home-hero-content relative z-[3] mx-auto flex w-full max-w-[1100px] flex-col justify-end px-4 sm:px-5 md:px-8">
        <p className="home-fade-up home-brand font-display text-[2.75rem] font-semibold leading-none tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
          Amani
        </p>
        <h1 className="home-fade-up home-fade-up-delay-1 mt-3 max-w-[20ch] text-balance font-display text-xl font-medium leading-snug sm:mt-4 sm:max-w-xl sm:text-2xl md:text-4xl">
          La création qui rassemble
        </h1>
        <p className="home-fade-up home-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-[15px] md:text-base">
          Musique, slam et poésie des artistes baha&apos;is de RDC — à écouter, partager, célébrer.
        </p>
        <div className="home-fade-up home-fade-up-delay-3 mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
          <a
            href="#nouveautes"
            className="home-cta-primary inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium sm:px-6 md:text-[15px]"
          >
            Écouter
          </a>
          <Link
            href="/evenements"
            className="home-cta-secondary inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium sm:px-6 md:text-[15px]"
          >
            Événements
          </Link>
        </div>
      </div>
    </section>
  );
}
