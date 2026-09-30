'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, MapMarker, Plus, Video } from '@primeicons/react';
import PageShell from '@/components/PageShell';
import { apiGet, apiPost, type EventItem } from '@/lib/api';
import { getSessionUser, getToken, type SessionUser } from '@/lib/auth';
import {
  subscribeToPush,
  isPushSupported,
  getNotificationPermission,
} from '@/lib/push';

type Filter = 'all' | 'online_live' | 'in_person';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80';

const REMINDERS_KEY = 'amani_event_reminders';

const FILTERS = [
  { key: 'all' as const, label: 'Tous' },
  { key: 'online_live' as const, label: 'En ligne' },
  { key: 'in_person' as const, label: 'Sur place' },
];

function loadRemindersFromLocalStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveRemindersToLocalStorage(ids: Set<string>) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify([...ids]));
}

function formatDay(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric' });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
}

function formatWhen(date: Date) {
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [session, setSession] = useState<SessionUser | null>(null);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSetupAttempted, setPushSetupAttempted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [upcomingList, pastList] = await Promise.all([
        apiGet<EventItem[]>('/events'),
        apiGet<EventItem[]>('/events/past').catch(() => [] as EventItem[]),
      ]);
      setEvents(upcomingList);
      setPastEvents(pastList);
    } catch {
      setEvents([]);
      setPastEvents([]);
      setMessage('Impossible de charger les événements.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReminders = useCallback(async (token: string) => {
    try {
      const response = await apiGet<{ eventIds: string[] }>(
        '/notifications/reminders',
        token,
      );
      const serverReminders = new Set(response.eventIds);
      setReminders(serverReminders);
      saveRemindersToLocalStorage(serverReminders);
      return serverReminders;
    } catch (error) {
      console.error('Failed to load reminders from server:', error);
      const localReminders = loadRemindersFromLocalStorage();
      setReminders(localReminders);
      return localReminders;
    }
  }, []);

  const setupPushIfNeeded = useCallback(async (token: string) => {
    if (pushSetupAttempted) return;
    setPushSetupAttempted(true);

    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return;
    }

    const permission = getNotificationPermission();
    if (permission === 'granted') {
      const result = await subscribeToPush(token);
      if (result.success) {
        setPushSubscribed(true);
        console.log('Push subscription registered');
      } else {
        console.warn('Failed to register push subscription:', result.error);
      }
    }
  }, [pushSetupAttempted]);

  useEffect(() => {
    const currentSession = getSessionUser();
    setSession(currentSession);

    if (currentSession) {
      const token = getToken();
      if (token) {
        void loadReminders(token);
        void setupPushIfNeeded(token);
      }
    } else {
      const localReminders = loadRemindersFromLocalStorage();
      setReminders(localReminders);
    }

    void load();
  }, [load, loadReminders, setupPushIfNeeded]);

  const canAnnounce = useMemo(() => {
    if (!session) return false;
    if (session.role === 'admin') return true;
    return session.role === 'artist' && session.verificationStatus === 'verified';
  }, [session]);

  const stats = useMemo(() => {
    const online = events.filter((e) => e.kind === 'online_live').length;
    const inPerson = events.filter((e) => e.kind === 'in_person').length;
    return [
      {
        key: 'total',
        label: 'À venir',
        value: events.length,
        icon: Calendar,
        tone: 'forest' as const,
      },
      {
        key: 'online',
        label: 'En ligne',
        value: online,
        icon: Video,
        tone: 'slate' as const,
      },
      {
        key: 'place',
        label: 'Sur place',
        value: inPerson,
        icon: MapMarker,
        tone: 'bronze' as const,
      },
    ];
  }, [events]);

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => e.kind === filter);
  }, [events, filter]);

  const filteredPast = useMemo(() => {
    if (filter === 'all') return pastEvents;
    return pastEvents.filter((e) => e.kind === filter);
  }, [pastEvents, filter]);

  const liveNow = useMemo(
    () => filtered.find((e) => e.isLiveNow) ?? events.find((e) => e.isLiveNow),
    [filtered, events],
  );

  const upcoming = useMemo(
    () => filtered.filter((e) => !e.isLiveNow || e.id !== liveNow?.id),
    [filtered, liveNow],
  );

  async function toggleReminder(id: string) {
    const token = getToken();
    const wasEnabled = reminders.has(id);
    const newEnabled = !wasEnabled;

    const newReminders = new Set(reminders);
    if (newEnabled) {
      newReminders.add(id);
    } else {
      newReminders.delete(id);
    }
    setReminders(newReminders);
    saveRemindersToLocalStorage(newReminders);

    if (token) {
      try {
        await apiPost(
          '/notifications/reminders/toggle',
          { eventId: id, enabled: newEnabled },
          token,
        );

        if (newEnabled && !pushSubscribed && isPushSupported()) {
          const permission = getNotificationPermission();
          if (permission === 'default') {
            const result = await subscribeToPush(token);
            if (result.success) {
              setPushSubscribed(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync reminder with server:', error);
      }
    }
  }

  async function handleJoin(event: EventItem) {
    const token = getToken();
    if (!token) {
      router.push('/connexion');
      return;
    }

    setJoiningId(event.id);
    setMessage('');
    try {
      const res = await apiGet<{ streamUrl?: string; title?: string }>(
        `/events/${event.id}/join`,
        token,
      );
      if (!res.streamUrl) {
        setMessage('Pas de lien de diffusion pour cet événement.');
        return;
      }
      window.open(res.streamUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Impossible de rejoindre le live.');
    } finally {
      setJoiningId(null);
    }
  }

  function renderEventCard(e: EventItem, opts?: { past?: boolean }) {
    const date = new Date(e.startsAt);
    const reminded = reminders.has(e.id);
    const isOnline = e.kind === 'online_live';
    const tone = isOnline ? 'online' : 'place';
    const isPast = Boolean(opts?.past);

    return (
      <article key={e.id} className={`events-card is-${tone}${isPast ? ' is-past' : ''}`}>
        <div className="events-card-date">
          <span className="events-card-month">{formatMonth(date)}</span>
          <span className="events-card-day">{formatDay(date)}</span>
        </div>

        <div className="events-card-body">
          <p className="events-card-title">{e.title}</p>
          <p className="events-card-host">{e.organizer.fullName}</p>
          <p className="events-card-when-plain">{formatWhen(date)}</p>
          <p className="events-card-meta-line">
            <span className="events-meta-host">{e.organizer.fullName}</span>
            <span className="events-meta-sep" aria-hidden>
              ·
            </span>
            <span>{e.city}</span>
            <span aria-hidden>·</span>
            <span className={`events-kind is-${tone}`}>
              {isOnline ? 'En ligne' : 'Sur place'}
            </span>
            {isPast && (
              <>
                <span aria-hidden>·</span>
                <span className="events-kind is-past-label">Passé</span>
              </>
            )}
          </p>
          <p className="events-card-when">
            <Calendar size={13} aria-hidden />
            <span>{formatWhen(date)}</span>
          </p>

          {!isOnline && e.venueAddress && (
            <p className="events-card-venue">{e.venueAddress}</p>
          )}

          {!isPast && isOnline && e.isLiveNow && (
            <button
              type="button"
              onClick={() => void handleJoin(e)}
              disabled={joiningId === e.id}
              className="events-card-join"
            >
              {joiningId === e.id ? 'Ouverture…' : 'Rejoindre'}
            </button>
          )}
        </div>

        {!isPast && (
          <button
            type="button"
            aria-label={reminded ? 'Retirer le rappel' : 'Activer un rappel'}
            aria-pressed={reminded}
            onClick={() => toggleReminder(e.id)}
            className={`events-bell ${reminded ? 'is-on' : ''} is-${tone}`}
          >
            <Bell size={16} aria-hidden />
          </button>
        )}
      </article>
    );
  }

  return (
    <PageShell>
      <main className="events-page pb-24 md:pb-12">
        <header className="events-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" className="events-hero-img" />
          <div className="events-hero-scrim" />
          <div className="events-hero-copy">
            <h1 className="events-hero-title">Événements</h1>
            <p className="events-hero-sub">
              Lives en ligne et rencontres sur place, au rythme de la communauté.
            </p>
          </div>
        </header>

        <div className="events-panel">
          <div className="events-stats" aria-label="Résumé des événements">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className={`events-stat is-${s.tone}`}>
                  <span className="events-stat-icon" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="events-stat-label">{s.label}</p>
                    <p className="events-stat-value">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="events-toolbar">
            <div className="events-filters" role="tablist" aria-label="Filtrer par type">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`events-filter ${filter === f.key ? 'is-active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {canAnnounce ? (
              <Link href="/publier" className="events-announce">
                <Plus size={16} aria-hidden />
                <span>Annoncer</span>
              </Link>
            ) : (
              <Link href="/publier" className="events-announce is-ghost">
                Annoncer
              </Link>
            )}
          </div>

          {message && <p className="events-message">{message}</p>}

          {loading ? (
            <p className="events-loading">Chargement…</p>
          ) : (
            <div className="events-fade">
              {liveNow && (
                <section className="events-live-section">
                  <div className="events-live-label">
                    <span className="home-live-dot" aria-hidden />
                    <span>En direct</span>
                  </div>
                  <div className="events-live">
                    <p className="events-live-title">{liveNow.title}</p>
                    <p className="events-live-meta">
                      {liveNow.organizer.fullName} · {liveNow.city}
                      {liveNow.kind === 'online_live' ? ' · Live en ligne' : ' · Sur place'}
                    </p>
                    {liveNow.kind === 'online_live' ? (
                      <button
                        type="button"
                        onClick={() => void handleJoin(liveNow)}
                        disabled={joiningId === liveNow.id}
                        className="events-live-join"
                      >
                        {joiningId === liveNow.id ? 'Ouverture…' : 'Rejoindre'}
                      </button>
                    ) : (
                      liveNow.venueAddress && (
                        <p className="events-card-venue mt-3">{liveNow.venueAddress}</p>
                      )
                    )}
                  </div>
                </section>
              )}

              <section>
                <h2 className="events-section-title">À venir</h2>

                {upcoming.length === 0 ? (
                  <p className="events-empty">
                    Aucun événement programmé pour le moment.
                    {canAnnounce ? ' Annonce un live depuis Publier.' : ' Reviens bientôt.'}
                  </p>
                ) : (
                  <div className="events-registry">
                    {upcoming.map((e) => renderEventCard(e))}
                  </div>
                )}
              </section>

              {filteredPast.length > 0 && (
                <section className="events-past-section">
                  <h2 className="events-section-title">Passés</h2>
                  <div className="events-registry">
                    {filteredPast.map((e) => renderEventCard(e, { past: true }))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
