'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiPost, type Work } from '../../lib/api';
import { canPlayInline, getMediaUrl, isExternalPlatform } from '../../lib/media';

type PlayerContextValue = {
  current: Work | null;
  isPlaying: boolean;
  error: string;
  progress: number;
  duration: number;
  volume: number;
  play: (work: Work) => Promise<void>;
  toggle: (work: Work) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (value: number) => void;
  seek: (ratio: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Work | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const countedRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.85;
    audioRef.current = audio;

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onError = () => {
      setIsPlaying(false);
      setError('Lecture impossible pour ce fichier.');
    };
    const onTimeUpdate = () => {
      const d = audio.duration;
      if (!d || Number.isNaN(d)) {
        setProgress(0);
        return;
      }
      setDuration(d);
      setProgress(audio.currentTime / d);
    };
    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audioRef.current = null;
    };
  }, []);

  const registerPlay = useCallback(async (workId: string) => {
    if (countedRef.current === workId) return;
    countedRef.current = workId;
    try {
      await apiPost(`/works/${workId}/play`, {});
    } catch {
      /* compteur non bloquant */
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrent(null);
    setIsPlaying(false);
    setError('');
    setProgress(0);
    setDuration(0);
  }, []);

  const setVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolumeState(next);
    if (audioRef.current) audioRef.current.volume = next;
  }, []);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || Number.isNaN(audio.duration)) return;
    const next = Math.min(1, Math.max(0, ratio));
    audio.currentTime = next * audio.duration;
    setProgress(next);
  }, []);

  const play = useCallback(
    async (work: Work) => {
      setError('');
      const url = getMediaUrl(work);

      if (work.sourceType === 'text' && work.textContent?.trim()) {
        setCurrent(work);
        setIsPlaying(false);
        audioRef.current?.pause();
        await registerPlay(work.id);
        return;
      }

      if (!url) {
        setCurrent(work);
        setIsPlaying(false);
        setError(
          'Aucun média jouable. Republie avec une URL audio (https://…) ou un lien YouTube / Spotify.',
        );
        return;
      }

      if (isExternalPlatform(url)) {
        audioRef.current?.pause();
        setCurrent(work);
        setIsPlaying(false);
        await registerPlay(work.id);
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      if (current?.id === work.id && audio.src) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setError('Lecture bloquée par le navigateur. Réessaie.');
        }
        return;
      }

      setCurrent(work);
      audio.crossOrigin = 'anonymous';
      audio.src = url;
      try {
        await audio.play();
        setIsPlaying(true);
        await registerPlay(work.id);
      } catch {
        setIsPlaying(false);
        setError('Lecture impossible. Vérifie que le lien pointe vers un fichier audio.');
      }
    },
    [current?.id, registerPlay],
  );

  const toggle = useCallback(
    async (work: Work) => {
      if (current?.id === work.id && isPlaying && canPlayInline(work)) {
        pause();
        return;
      }
      await play(work);
    },
    [current?.id, isPlaying, pause, play],
  );

  const value = useMemo(
    () => ({
      current,
      isPlaying,
      error,
      progress,
      duration,
      volume,
      play,
      toggle,
      pause,
      stop,
      setVolume,
      seek,
    }),
    [current, isPlaying, error, progress, duration, volume, play, toggle, pause, stop, setVolume, seek],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer doit etre dans PlayerProvider');
  return ctx;
}
