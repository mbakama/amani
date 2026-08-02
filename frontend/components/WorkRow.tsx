'use client';

import Link from 'next/link';
import { useState } from 'react';
import ArtistAvatar from './ArtistAvatar';
import {
  BookIcon,
  ChevronUpIcon,
  ExternalIcon,
  PauseIcon,
  PlayIcon,
} from './icons/MediaIcons';
import { usePlayer } from './player/PlayerProvider';
import type { ModerationStatus, Work } from '../lib/api';
import { getMediaUrl, hasPlayableMedia, isExternalPlatform } from '../lib/media';

const TYPE_LABEL: Record<Work['type'], string> = {
  music: 'Musique',
  slam: 'Slam',
  poem: 'Poème',
};

const STATUS_LABEL: Record<ModerationStatus, string> = {
  published: 'Publiée',
  flagged: 'Signalée',
  removed: 'Retirée',
};

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Ligne de morceau/oeuvre — lecture depuis le player global
export default function WorkRow({
  work,
  hideArtist = false,
  showStatus = false,
}: {
  work: Work;
  hideArtist?: boolean;
  showStatus?: boolean;
}) {
  const { current, isPlaying, toggle } = usePlayer();
  const [showText, setShowText] = useState(false);
  const duration = formatDuration(work.durationSeconds);
  const active = current?.id === work.id;
  const playing = active && isPlaying;
  const playable = hasPlayableMedia(work);
  const url = getMediaUrl(work);
  const external = url ? isExternalPlatform(url) : false;
  const isText = work.sourceType === 'text' || Boolean(work.textContent?.trim() && !url);
  const status = work.moderationStatus || 'published';
  const isRemoved = status === 'removed';

  async function handlePlay() {
    if (!playable || isRemoved) return;
    if (isText) setShowText((v) => !v);
    await toggle(work);
  }

  const meta = [
    duration,
    TYPE_LABEL[work.type],
    work.style || null,
    work.city || null,
    external ? 'Lien' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`border-t border-[var(--amani-forest)]/10 first:border-t-0 transition-colors ${
        active ? 'bg-[var(--amani-forest)]/[0.06]' : ''
      } ${isRemoved ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-5 md:py-3.5">
        {!hideArtist && (
          <Link
            href={`/profil/${work.artist.id}`}
            className="flex-shrink-0"
            aria-label={work.artist.fullName}
          >
            <ArtistAvatar name={work.artist.fullName} size={42} />
          </Link>
        )}

        <button
          type="button"
          onClick={() => void handlePlay()}
          disabled={!playable || isRemoved}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--amani-ink)] md:text-[15px]">
              {work.title}
            </p>
            {showStatus && status !== 'published' && (
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  status === 'removed'
                    ? 'bg-[rgba(163,45,45,0.12)] text-[#a32d2d]'
                    : 'bg-[rgba(196,122,58,0.16)] text-[#9a5b22]'
                }`}
              >
                {STATUS_LABEL[status]}
              </span>
            )}
            {showStatus && status === 'published' && work.isFeatured && (
              <span className="flex-shrink-0 rounded-full bg-[rgba(30,77,61,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--amani-forest)]">
                En avant
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--amani-forest)]/70 md:text-[13px]">
            {!hideArtist && (
              <span className="text-[var(--amani-forest)]">{work.artist.fullName}</span>
            )}
            {!hideArtist && meta ? ` · ${meta}` : meta}
          </p>
          {!playable && !isRemoved && (
            <span className="mt-1 inline-block rounded bg-[var(--amani-forest)]/8 px-1.5 py-0.5 text-[10px] text-[var(--amani-forest)]/55">
              Média indisponible
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label={
            isText
              ? showText
                ? 'Masquer le texte'
                : 'Lire le texte'
              : playing
                ? 'Pause'
                : external
                  ? 'Ouvrir le lien'
                  : 'Écouter'
          }
          disabled={!playable || isRemoved}
          onClick={() => void handlePlay()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35"
          style={
            playable && !isRemoved
              ? playing || (isText && showText)
                ? { background: 'var(--amani-bronze)', color: '#fff' }
                : { background: 'rgba(30, 77, 61, 0.12)', color: 'var(--amani-forest)' }
              : { background: 'rgba(30, 77, 61, 0.06)', color: 'rgba(30, 77, 61, 0.35)' }
          }
        >
          {isText ? (
            showText ? (
              <ChevronUpIcon size={18} />
            ) : (
              <BookIcon size={18} />
            )
          ) : playing ? (
            <PauseIcon size={18} />
          ) : external ? (
            <ExternalIcon size={17} />
          ) : (
            <PlayIcon size={18} />
          )}
        </button>
      </div>

      {isText && showText && work.textContent && (
        <div className="border-t border-[var(--amani-forest)]/8 bg-white/50 px-5 py-3.5 md:px-6">
          <p className="whitespace-pre-wrap font-display text-sm leading-relaxed text-[var(--amani-ink)]">
            {work.textContent}
          </p>
        </div>
      )}
    </div>
  );
}
