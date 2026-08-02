'use client';

import Link from 'next/link';
import { Pause, Play } from '@primeicons/react';
import ArtistAvatar from '../ArtistAvatar';
import { usePlayer } from '../player/PlayerProvider';
import type { Work } from '../../lib/api';
import { getMediaUrl, hasPlayableMedia, isExternalPlatform } from '../../lib/media';

const TYPE_LABEL: Record<Work['type'], string> = {
  music: 'Single',
  slam: 'Slam',
  poem: 'Poème',
};

const TYPE_BADGE: Record<Work['type'], string> = {
  music: 'bg-[rgba(30,77,61,0.1)] text-[var(--amani-forest)]',
  slam: 'bg-[rgba(166,124,82,0.14)] text-[#8a6540]',
  poem: 'bg-[rgba(60,100,120,0.12)] text-[#3a5f72]',
};

function formatDuration(seconds?: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HomeWorkCard({ work }: { work: Work }) {
  const { current, isPlaying, toggle } = usePlayer();
  const active = current?.id === work.id;
  const playing = active && isPlaying;
  const playable = hasPlayableMedia(work);
  const url = getMediaUrl(work);
  const external = url ? isExternalPlatform(url) : false;

  return (
    <article
      className={`flex items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2.5 transition sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3 ${
        active
          ? 'border-[rgba(30,77,61,0.22)] shadow-[0_6px_18px_rgba(30,77,61,0.08)]'
          : 'border-[#EAE8E2] shadow-[0_2px_10px_rgba(20,32,28,0.03)]'
      }`}
    >
      <Link
        href={`/profil/${work.artist.id}`}
        className="home-work-thumb flex-shrink-0"
        aria-label={work.artist.fullName}
      >
        <ArtistAvatar name={work.artist.fullName} size={44} />
      </Link>

      <button
        type="button"
        onClick={() => playable && void toggle(work)}
        disabled={!playable}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className="truncate text-[13px] font-semibold text-[var(--amani-ink)] sm:text-[15px]">
          {work.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[rgba(20,32,28,0.5)] sm:text-[12px]">
          {work.artist.fullName}
          {' · '}
          {work.style || TYPE_LABEL[work.type]}
          {external ? ' · Lien' : ''}
        </p>
      </button>

      <span className="flex-shrink-0 text-[11px] tabular-nums text-[rgba(20,32,28,0.45)] sm:text-[12px]">
        {formatDuration(work.durationSeconds)}
      </span>

      <span
        className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium md:inline ${TYPE_BADGE[work.type]}`}
      >
        {work.style || TYPE_LABEL[work.type]}
      </span>

      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Écouter'}
        disabled={!playable}
        onClick={() => playable && void toggle(work)}
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-35 sm:h-10 sm:w-10 ${
          playing || active
            ? 'bg-[var(--amani-forest)] text-white shadow-[0_4px_12px_rgba(30,77,61,0.28)]'
            : 'text-[var(--amani-forest)] hover:bg-[rgba(30,77,61,0.08)]'
        }`}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
    </article>
  );
}
