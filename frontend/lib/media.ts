import type { Work } from './api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Remplace localhost par l'URL API accessible (ex. IP LAN pour le telephone). */
export function resolvePlayableUrl(url: string | null | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const media = new URL(url);
    if (media.hostname === 'localhost' || media.hostname === '127.0.0.1') {
      const api = new URL(API_BASE);
      media.protocol = api.protocol;
      media.hostname = api.hostname;
      media.port = api.port;
      return media.toString();
    }
  } catch {
    return url;
  }
  return url;
}

/** URL lisible (audio direct ou lien externe). */
export function getMediaUrl(work: Work): string | null {
  if (work.sourceType === 'link' && work.externalUrl) {
    return resolvePlayableUrl(work.externalUrl) || work.externalUrl;
  }
  if (work.externalUrl && /^https?:\/\//i.test(work.externalUrl)) {
    return resolvePlayableUrl(work.externalUrl) || work.externalUrl;
  }
  if (work.fileUrl && /^https?:\/\//i.test(work.fileUrl)) {
    return resolvePlayableUrl(work.fileUrl);
  }
  return null;
}

export function isExternalPlatform(url: string): boolean {
  return /youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|vimeo\.com/i.test(url);
}

export function canPlayInline(work: Work): boolean {
  const url = getMediaUrl(work);
  return Boolean(url && !isExternalPlatform(url));
}

export function hasPlayableMedia(work: Work): boolean {
  if (work.sourceType === 'text' && work.textContent?.trim()) return true;
  return Boolean(getMediaUrl(work));
}
