'use client';

import ArtistAvatar from '../ArtistAvatar';
import { CloseIcon, PauseIcon, PlayIcon } from '../icons/MediaIcons';
import { usePlayer } from './PlayerProvider';
import { getMediaUrl, isExternalPlatform } from '../../lib/media';

export default function NowPlayingBar() {
  const { current, isPlaying, error, toggle, stop } = usePlayer();
  if (!current && !error) return null;

  const url = current ? getMediaUrl(current) : null;
  const external = url ? isExternalPlatform(url) : false;
  const canToggleAudio = !external && current?.sourceType !== 'text';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.85rem+env(safe-area-inset-bottom,0px))] z-50 px-3 md:bottom-5 md:px-6">
      {current && (
        <div
          className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[0_10px_40px_rgba(20,32,28,0.28)]"
          style={{ background: 'var(--amani-ink)', color: '#fff' }}
        >
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
            onClick={() => void toggle(current)}
            disabled={!canToggleAudio}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full disabled:opacity-45"
            style={{ background: 'var(--amani-bronze)', color: '#fff' }}
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isPlaying && (
                <span className="now-playing-eq" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              )}
              <p className="truncate text-sm font-medium text-white">{current.title}</p>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-white/70">
              {current.artist.fullName}
              {external ? ' · lien externe' : ''}
              {current.sourceType === 'text' ? ' · texte' : ''}
            </p>
          </div>

          <ArtistAvatar name={current.artist.fullName} size={34} />

          <button
            type="button"
            aria-label="Fermer"
            onClick={stop}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {error && (
        <p
          className="pointer-events-auto mx-auto mt-2 max-w-3xl rounded-xl px-3 py-2 text-center text-[11px] text-white"
          style={{ background: '#a32d2d' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
