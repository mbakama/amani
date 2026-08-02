import Link from 'next/link';

export const metadata = {
  title: 'Hors ligne — Amani',
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl font-semibold text-[var(--amani-ink)]">Amani</p>
      <p className="mt-3 text-sm text-[var(--amani-forest)]">
        Tu es hors ligne. Certaines pages consultées restent disponibles.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md px-5 py-2.5 text-sm font-medium text-white"
        style={{ background: 'var(--amani-bronze)' }}
      >
        Réessayer l&apos;accueil
      </Link>
    </main>
  );
}
