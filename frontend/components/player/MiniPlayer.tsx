'use client';

import { usePathname } from 'next/navigation';
import {
  ArrowRightArrowLeft,
  Pause,
  Play,
  Replay,
  StepBackward,
  StepForward,
  Times,
  VolumeUp,
} from '@primeicons/react';
import ArtistAvatar from '../ArtistAvatar';
import { usePlayer } from './PlayerProvider';
import { canPlayInline, getMediaUrl, isExternalPlatform } from '../../lib/media';

export default function MiniPlayer() {
  const pathname = usePathname() ?? '';
  const { current, isPlaying, error, progress, volume, toggle, stop, setVolume, seek } = usePlayer();

  if (!current && !error) return null;

  const aboveBottomNav = !pathname.startsWith('/admin');
  const url = current ? getMediaUrl(current) : null;
  const external = url ? isExternalPlatform(url) : false;
  const canToggleAudio = Boolean(
    current && !external && current.sourceType !== 'text' && canPlayInline(current),
  );
  const progressPct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[45] px-3 md:px-6 ${
        aboveBottomNav
          ? 'bottom-[calc(3.85rem+env(safe-area-inset-bottom,0px))] md:bottom-5'
          : 'bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:bottom-5'
      }`}
    >
      {current && (
        <div className="pointer-events-auto relative mx-auto max-w-4xl overflow-hidden rounded-[1.35rem] border border-[#EAE8E2] bg-white shadow-[0_8px_28px_rgba(20,32,28,0.12)] md:rounded-2xl md:bg-[#FAFAF7]">
          {/* Progress */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[#E8EEF0] md:h-[3px]">
            <div
              className="h-full bg-[var(--amani-forest)] transition-[width] duration-150 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <button
            type="button"
            aria-label="Position dans le titre"
            className="absolute inset-x-0 top-0 z-10 h-3 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio);
            }}
          />

          {/* Mobile : capture compacte */}
          <div className="flex items-center gap-3 px-3.5 py-3 pt-3.5 md:hidden">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <ArtistAvatar name={current.artist.fullName} size={38} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight text-[var(--amani-ink)]">
                  {current.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[rgba(20,32,28,0.5)]">
                  {current.artist.fullName}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
                onClick={() => void toggle(current)}
                disabled={!canToggleAudio}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--amani-forest)] text-white shadow-[0_4px_12px_rgba(30,77,61,0.25)] disabled:opacity-45"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                aria-label="Fermer"
                onClick={stop}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[rgba(20,32,28,0.55)]"
              >
                <Times size={16} />
              </button>
            </div>
          </div>

          {/* Desktop : barre complete */}
          <div className="hidden items-center gap-4 px-4 py-3 pt-3.5 md:flex">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <ArtistAvatar name={current.artist.fullName} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--amani-ink)]">
                  {current.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-[rgba(20,32,28,0.55)]">
                  {current.artist.fullName}
                  {external ? ' · lien externe' : ''}
                  {current.sourceType === 'text' ? ' · texte' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Precedent"
                disabled
                className="flex h-9 w-9 items-center justify-center rounded-full text-[rgba(20,32,28,0.35)]"
              >
                <StepBackward size={16} />
              </button>
              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
                onClick={() => void toggle(current)}
                disabled={!canToggleAudio}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--amani-forest)] text-white shadow-[0_6px_16px_rgba(30,77,61,0.28)] transition hover:bg-[#163d30] disabled:opacity-45"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                aria-label="Suivant"
                disabled
                className="flex h-9 w-9 items-center justify-center rounded-full text-[rgba(20,32,28,0.35)]"
              >
                <StepForward size={16} />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="flex items-center gap-2">
                <VolumeUp size={16} className="text-[rgba(20,32,28,0.55)]" aria-hidden />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  aria-label="Volume"
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="mini-player-volume"
                  style={{ ['--vol' as string]: `${Math.round(volume * 100)}%` }}
                />
              </div>
              <button
                type="button"
                aria-label="Aleatoire"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-full text-[rgba(20,32,28,0.4)]"
              >
                <ArrowRightArrowLeft size={15} />
              </button>
              <button
                type="button"
                aria-label="Repeter"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-full text-[rgba(20,32,28,0.4)]"
              >
                <Replay size={15} />
              </button>
              <span className="mx-1 h-5 w-px bg-[#EAE8E2]" aria-hidden />
              <button
                type="button"
                aria-label="Fermer"
                onClick={stop}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[rgba(20,32,28,0.55)] transition hover:bg-[rgba(30,77,61,0.08)] hover:text-[var(--amani-ink)]"
              >
                <Times size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="pointer-events-auto mx-auto mt-2 max-w-4xl rounded-xl bg-[#a32d2d] px-3 py-2 text-center text-[11px] text-white">
          {error}
        </p>
      )}
    </div>
  );
}
