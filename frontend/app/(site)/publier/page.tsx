'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import {
  BroadcastIcon,
  LinkIcon,
  MusicIcon,
  UploadIcon,
} from '@/components/icons/MediaIcons';
import { apiGet, apiPost, apiUpload, type UserProfile, type WorkType } from '@/lib/api';
import {
  clearSession,
  getSessionUser,
  getToken,
  updateSessionUser,
  type SessionUser,
} from '@/lib/auth';

type Mode = 'file' | 'link' | 'live';
type LiveKind = 'online_live' | 'in_person';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80';

const MODES: {
  key: Mode;
  label: string;
  hint: string;
  hintMobile: string;
  Icon: typeof UploadIcon;
}[] = [
  {
    key: 'file',
    label: 'Fichier',
    hint: 'Audio ou vidéo',
    hintMobile: 'Audio ou vidéo',
    Icon: UploadIcon,
  },
  {
    key: 'link',
    label: 'Lien',
    hint: 'YouTube, Spotify…',
    hintMobile: 'Spotify, YouTube',
    Icon: LinkIcon,
  },
  {
    key: 'live',
    label: 'Live',
    hint: 'Annoncer un événement',
    hintMobile: 'Annoncer event',
    Icon: BroadcastIcon,
  },
];

const WORK_TYPES: { key: WorkType; label: string }[] = [
  { key: 'music', label: 'Musique' },
  { key: 'slam', label: 'Slam' },
  { key: 'poem', label: 'Poème' },
];

function toSessionUser(profile: UserProfile): SessionUser {
  return {
    id: profile.id,
    fullName: profile.fullName,
    role: profile.role,
    verificationStatus: profile.verificationStatus,
  };
}

export default function PublishPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('file');
  const [workType, setWorkType] = useState<WorkType>('music');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [city, setCity] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [liveKind, setLiveKind] = useState<LiveKind>('online_live');
  const [startsAt, setStartsAt] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getToken();
    const cached = getSessionUser();
    if (!token) {
      setSession(null);
      setReady(true);
      return;
    }

    if (cached) setSession(cached);

    void apiGet<UserProfile>('/users/me', token)
      .then((me) => {
        const next = toSessionUser(me);
        updateSessionUser(next);
        setSession(next);
      })
      .catch(() => {
        clearSession();
        setSession(null);
      })
      .finally(() => setReady(true));
  }, []);

  const canPublish = useMemo(() => {
    if (!session) return false;
    if (session.role === 'admin') return true;
    return session.role === 'artist' && session.verificationStatus === 'verified';
  }, [session]);

  const gate = useMemo(() => {
    if (!ready) return 'loading' as const;
    if (!session || !getToken()) return 'auth' as const;
    if (session.role === 'visitor') return 'visitor' as const;
    if (session.role === 'artist' && session.verificationStatus === 'pending') return 'pending' as const;
    if (session.role === 'artist' && session.verificationStatus === 'rejected') return 'rejected' as const;
    if (!canPublish) return 'auth' as const;
    return 'ok' as const;
  }, [ready, session, canPublish]);

  function resetForm() {
    setTitle('');
    setStyle('');
    setCity('');
    setExternalUrl('');
    setFileUrl('');
    setFileName('');
    setLocalFile(null);
    setTextContent('');
    setStartsAt('');
    setStreamUrl('');
    setVenueAddress('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !canPublish) return;

    setStatus('sending');
    setMessage('');

    try {
      if (mode === 'live') {
        if (!title.trim() || !city.trim() || !startsAt) {
          throw new Error('Titre, ville et date sont requis pour un live.');
        }
        await apiPost(
          '/events',
          {
            title: title.trim(),
            kind: liveKind,
            city: city.trim(),
            startsAt: new Date(startsAt).toISOString(),
            ...(liveKind === 'online_live' && streamUrl ? { streamUrl: streamUrl.trim() } : {}),
            ...(liveKind === 'in_person' && venueAddress
              ? { venueAddress: venueAddress.trim() }
              : {}),
          },
          token,
        );
        setMessage('Événement annoncé. Il apparaîtra dans le calendrier.');
      } else {
        if (!title.trim()) throw new Error('Le titre est requis.');
        if (mode === 'link' && !externalUrl.trim()) {
          throw new Error('Colle le lien de ta publication.');
        }
        if (mode === 'file' && workType !== 'poem' && !localFile && !fileUrl.trim()) {
          throw new Error('Choisis un fichier audio/vidéo, ou colle une URL https.');
        }
        if (workType === 'poem' && mode === 'file' && !textContent.trim()) {
          throw new Error('Écris le texte de ton poème, ou passe en mode Lien.');
        }

        let uploadedUrl = fileUrl.trim();
        if (mode === 'file' && localFile) {
          setMessage('Envoi du fichier…');
          const uploaded = await apiUpload<{ fileUrl: string }>(
            '/works/upload',
            localFile,
            token,
          );
          uploadedUrl = uploaded.fileUrl;
        }

        await apiPost(
          '/works',
          {
            type: workType,
            title: title.trim(),
            style: style.trim() || undefined,
            city: city.trim() || undefined,
            sourceType: mode === 'link' ? 'link' : workType === 'poem' && textContent ? 'text' : 'file',
            ...(mode === 'link' ? { externalUrl: externalUrl.trim() } : {}),
            ...(mode === 'file' && uploadedUrl ? { fileUrl: uploadedUrl } : {}),
            ...(textContent.trim() ? { textContent: textContent.trim() } : {}),
          },
          token,
        );
        setMessage('Publication en ligne. Tu peux écouter depuis Nouveautés.');
      }

      setStatus('done');
      resetForm();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'La publication a échoué. Réessaie.');
    }
  }

  return (
    <PageShell>
      <main className="publish-page pb-24 md:pb-12">
        <header className="publish-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" className="publish-hero-img" />
          <div className="publish-hero-scrim" />
          <div className="publish-hero-copy">
            <p className="publish-hero-eyebrow">Amani Studio</p>
            <h1 className="publish-hero-title">
              <span className="md:hidden">Amani Publier</span>
              <span className="hidden md:inline">Publier un contenu</span>
            </h1>
            <p className="publish-hero-sub">
              Partage un morceau, un texte, ou annonce un live pour la communauté.
            </p>
          </div>
        </header>

        <div className="publish-panel">
          {gate === 'loading' && <p className="publish-loading">Chargement…</p>}

          {gate === 'auth' && (
            <Gate
              title="Connecte-toi pour publier"
              body="La publication est réservée aux artistes vérifiés. Connecte-toi ou crée un compte artiste."
              actionHref="/connexion"
              actionLabel="Se connecter"
            />
          )}

          {gate === 'visitor' && (
            <Gate
              title="Compte artiste requis"
              body="Les visiteurs peuvent écouter et rejoindre les lives. Pour publier, inscris-toi en tant qu'artiste."
              actionHref="/inscription"
              actionLabel="Créer un compte artiste"
            />
          )}

          {gate === 'pending' && (
            <Gate
              title="Validation en cours"
              body="Ton compte artiste attend la vérification d'un administrateur. Tu pourras publier ensuite."
              actionHref="/profil/moi"
              actionLabel="Voir mon profil"
              tone="warn"
            />
          )}

          {gate === 'rejected' && (
            <Gate
              title="Compte non valide"
              body="Ta demande artiste n'a pas été acceptée. Contacte l'équipe Amani si besoin."
              actionHref="/"
              actionLabel="Retour à l'accueil"
              tone="danger"
            />
          )}

          {gate === 'ok' && (
            <form onSubmit={handleSubmit} className="publish-fade publish-form">
              <section>
                <p className="publish-label">Mode</p>
                <div className="publish-modes" role="tablist" aria-label="Mode de publication">
                  {MODES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      role="tab"
                      aria-selected={mode === m.key}
                      onClick={() => {
                        setMode(m.key);
                        setStatus('idle');
                        setMessage('');
                      }}
                      className={`publish-mode ${mode === m.key ? 'is-active' : ''}`}
                    >
                      <span className="publish-mode-icon" aria-hidden>
                        <m.Icon size={20} />
                      </span>
                      <span className="publish-mode-label">{m.label}</span>
                      <span className="publish-mode-hint">
                        <span className="md:hidden">{m.hintMobile}</span>
                        <span className="hidden md:inline">{m.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {mode !== 'live' && (
                <section>
                  <p className="publish-label">
                    <span className="md:hidden">Type</span>
                    <span className="hidden md:inline">Type de contenu</span>
                  </p>
                  <div className="publish-types" role="group" aria-label="Type de contenu">
                    {WORK_TYPES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setWorkType(t.key)}
                        className={`publish-type ${workType === t.key ? 'is-active' : ''}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {mode === 'file' && workType !== 'poem' && (
                <div className="publish-drop">
                  <label className="publish-drop-label">
                    <input
                      type="file"
                      accept="audio/*,video/mp4,.mp3,.wav,.m4a,.ogg,.webm"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setLocalFile(file);
                        setFileName(file?.name || '');
                        if (file) setFileUrl('');
                      }}
                    />
                    <span className="publish-drop-icon" aria-hidden>
                      <MusicIcon size={22} />
                    </span>
                    <p className="publish-drop-title">
                      {fileName || 'Choisir un fichier audio ou vidéo'}
                    </p>
                    <p className="publish-drop-hint">
                      <span className="md:hidden">MP3, WAV, MP4 · 200 Mo max</span>
                      <span className="hidden md:inline">
                        MP3, WAV, MP4 - 200 Mo max — envoyé au serveur à la publication
                      </span>
                    </p>
                  </label>
                  <div className="publish-drop-url">
                    <Field
                      label="Ou URL audio (optionnel)"
                      value={fileUrl}
                      onChange={(v) => {
                        setFileUrl(v);
                        if (v.trim()) {
                          setLocalFile(null);
                          setFileName('');
                        }
                      }}
                      placeholder="https://…/morceau.mp3"
                      type="url"
                    />
                  </div>
                </div>
              )}

              {mode === 'file' && workType === 'poem' && (
                <label className="publish-field">
                  <span className="publish-field-label">Texte</span>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={6}
                    placeholder="Écris ton poème ici…"
                    className="publish-input publish-textarea"
                    required
                  />
                </label>
              )}

              {mode === 'link' && (
                <Field
                  label="Lien externe"
                  value={externalUrl}
                  onChange={setExternalUrl}
                  placeholder="https://youtube.com/… ou Spotify, SoundCloud"
                  required
                  type="url"
                />
              )}

              {mode === 'live' && (
                <section className="publish-live-fields">
                  <p className="publish-label">Format du live</p>
                  <div className="publish-types">
                    <button
                      type="button"
                      onClick={() => setLiveKind('online_live')}
                      className={`publish-type ${liveKind === 'online_live' ? 'is-active' : ''}`}
                    >
                      En ligne
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveKind('in_person')}
                      className={`publish-type ${liveKind === 'in_person' ? 'is-active' : ''}`}
                    >
                      En présentiel
                    </button>
                  </div>
                  <Field
                    label="Date et heure"
                    type="datetime-local"
                    value={startsAt}
                    onChange={setStartsAt}
                    required
                  />
                  {liveKind === 'online_live' ? (
                    <Field
                      label="Lien de diffusion"
                      value={streamUrl}
                      onChange={setStreamUrl}
                      placeholder="https://…"
                      type="url"
                    />
                  ) : (
                    <Field
                      label="Adresse du lieu"
                      value={venueAddress}
                      onChange={setVenueAddress}
                      placeholder="Ex. Centre communautaire, Gombe"
                    />
                  )}
                </section>
              )}

              <section className="publish-meta">
                <Field
                  label="Titre"
                  value={title}
                  onChange={setTitle}
                  placeholder={
                    mode === 'live' ? 'Ex. Soirée de prière chantée' : 'Ex. Prière du matin'
                  }
                  required
                />
                {mode !== 'live' && (
                  <Field
                    label="Style"
                    value={style}
                    onChange={setStyle}
                    placeholder="Ex. Chant spirituel, slam engagé…"
                  />
                )}
                <Field
                  label="Ville"
                  value={city}
                  onChange={setCity}
                  placeholder="Ex. Kinshasa"
                  required={mode === 'live'}
                />
              </section>

              <button type="submit" disabled={status === 'sending'} className="publish-submit">
                {status === 'sending'
                  ? 'Publication…'
                  : mode === 'live'
                    ? 'Annoncer le live'
                    : 'Publier'}
              </button>

              {message && (
                <p className={`publish-message ${status === 'error' ? 'is-error' : ''}`}>
                  {message}
                </p>
              )}
            </form>
          )}
        </div>
      </main>
    </PageShell>
  );
}

function Gate({
  title,
  body,
  actionHref,
  actionLabel,
  tone = 'default',
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  tone?: 'default' | 'warn' | 'danger';
}) {
  return (
    <div
      className={`publish-fade publish-gate ${
        tone === 'warn' ? 'is-warn' : tone === 'danger' ? 'is-danger' : ''
      }`}
    >
      <p className="publish-gate-title">{title}</p>
      <p className="publish-gate-body">{body}</p>
      <Link href={actionHref} className="publish-gate-action">
        {actionLabel}
      </Link>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="publish-field">
      <span className="publish-field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="publish-input"
      />
    </label>
  );
}
