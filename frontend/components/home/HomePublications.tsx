'use client';

import { useMemo, useState } from 'react';
import HomeWorkCard from './HomeWorkCard';
import type { Work, WorkType } from '../../lib/api';
import { usePlayer } from '../player/PlayerProvider';
import { hasPlayableMedia } from '../../lib/media';

type FilterKey = 'all' | WorkType | `style:${string}`;

const TYPE_FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'music', label: 'Musique' },
  { key: 'slam', label: 'Slam' },
  { key: 'poem', label: 'Poésie' },
];

export default function HomePublications({ works }: { works: Work[] }) {
  const { play } = usePlayer();
  const [filter, setFilter] = useState<FilterKey>('all');

  const styleFilters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of works) {
      const style = w.style?.trim();
      if (!style) continue;
      const lower = style.toLowerCase();
      if (['musique', 'slam', 'poeme', 'poésie', 'poesie', 'single'].includes(lower)) continue;
      counts.set(style, (counts.get(style) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
      .slice(0, 4)
      .map(([style]) => ({ key: `style:${style}` as FilterKey, label: style }));
  }, [works]);

  const chips = [...TYPE_FILTERS, ...styleFilters];

  const filtered = useMemo(() => {
    if (filter === 'all') return works;
    if (filter === 'music' || filter === 'slam' || filter === 'poem') {
      return works.filter((w) => w.type === filter);
    }
    if (filter.startsWith('style:')) {
      const style = filter.slice('style:'.length);
      return works.filter((w) => (w.style || '').trim() === style);
    }
    return works;
  }, [works, filter]);

  async function listenAll() {
    const first = filtered.find((w) => hasPlayableMedia(w));
    if (first) await play(first);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition sm:px-4 sm:text-[13px] ${
                  active
                    ? 'bg-[var(--amani-forest)] text-white shadow-[0_4px_12px_rgba(30,77,61,0.22)]'
                    : 'border border-[#EAE8E2] bg-[#F3F5F4] text-[rgba(20,32,28,0.7)] hover:border-[rgba(30,77,61,0.25)] hover:bg-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void listenAll()}
          disabled={filtered.every((w) => !hasPlayableMedia(w))}
          className="hidden flex-shrink-0 text-sm font-medium text-[var(--amani-forest)] transition hover:text-[#163d30] disabled:opacity-40 md:inline"
        >
          Écouter tout
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#EAE8E2] bg-white px-5 py-8 text-sm text-[rgba(20,32,28,0.6)]">
          Aucune publication dans cette catégorie.
        </div>
      ) : (
        <>
          <div className="mb-3 flex justify-end md:hidden">
            <button
              type="button"
              onClick={() => void listenAll()}
              className="text-[12px] font-medium text-[var(--amani-forest)]"
            >
              Écouter tout
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {filtered.map((w) => (
              <HomeWorkCard key={w.id} work={w} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
