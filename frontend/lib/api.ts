const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type WorkType = 'music' | 'slam' | 'poem';
export type UserRole = 'visitor' | 'artist' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'blocked';
export type WorkSourceType = 'file' | 'link' | 'text';
export type ModerationStatus = 'published' | 'flagged' | 'removed';

export interface Work {
  id: string;
  type: WorkType;
  title: string;
  style?: string;
  city?: string;
  sourceType?: WorkSourceType;
  fileUrl?: string | null;
  externalUrl?: string | null;
  textContent?: string | null;
  durationSeconds?: number;
  playCount: number;
  isFeatured?: boolean;
  moderationStatus?: ModerationStatus;
  createdAt?: string;
  artist: {
    id: string;
    fullName: string;
    city?: string;
    verificationStatus?: VerificationStatus;
  };
}

export interface EventItem {
  id: string;
  title: string;
  kind: 'online_live' | 'in_person';
  city: string;
  startsAt: string;
  venueAddress?: string | null;
  isLiveNow: boolean;
  organizer: { id?: string; fullName: string };
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  city?: string;
  discipline?: string;
  bio?: string;
  avatarUrl?: string;
  verificationStatus: VerificationStatus;
  verificationReference?: string;
  works?: Array<{
    id: string;
    type: WorkType;
    title: string;
    style?: string;
    city?: string;
    sourceType?: WorkSourceType;
    fileUrl?: string | null;
    externalUrl?: string | null;
    textContent?: string | null;
    durationSeconds?: number;
    playCount: number;
    isFeatured?: boolean;
    moderationStatus?: ModerationStatus;
  }>;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    role: UserRole;
    verificationStatus: VerificationStatus;
  };
}

export type ActivityType =
  | 'artist_registered'
  | 'artist_verified'
  | 'artist_rejected'
  | 'artist_blocked'
  | 'artist_unblocked'
  | 'work_published'
  | 'work_featured'
  | 'work_unfeatured'
  | 'work_removed'
  | 'work_restored';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  message: string;
  actorId?: string | null;
  actorLabel?: string | null;
  subjectUserId?: string | null;
  subjectLabel?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityListResult {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

async function parseError(res: Response, path: string) {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.message
      ? Array.isArray(body.message)
        ? body.message.join(', ')
        : String(body.message)
      : '';
  } catch {
    /* ignore */
  }
  throw new Error(detail || `Erreur API ${res.status} sur ${path}`);
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) await parseError(res, path);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await parseError(res, path);
  return res.json();
}

/** Upload multipart (fichier audio/video) — ne pas fixer Content-Type. */
export async function apiUpload<T>(
  path: string,
  file: File,
  token: string,
  fieldName = 'file',
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) await parseError(res, path);
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await parseError(res, path);
  return res.json();
}

export async function apiDelete<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await parseError(res, path);
  return res.json();
}
