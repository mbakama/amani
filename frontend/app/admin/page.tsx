'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AngleRight,
  CheckCircle,
  Clipboard,
  ExternalLink,
  Plus,
  Star,
  Users,
} from '@primeicons/react';
import {
  apiGet,
  type ActivityLog,
  type UserProfile,
  type Work,
} from '../../lib/api';
import { getToken } from '../../lib/auth';
import { formatActivityWhen, initials } from '../../lib/relativeTime';

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const AVATAR_TONES = ['forest', 'bronze', 'slate', 'mist'] as const;

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function countInRange(dates: Date[], from: Date, to: Date) {
  return dates.filter((d) => d >= from && d < to).length;
}

function trendLabel(current: number, previous: number) {
  if (previous === 0 && current === 0) return { text: 'Stable', tone: 'stable' as const };
  if (previous === 0) return { text: '+100%', tone: 'up' as const };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: 'Stable', tone: 'stable' as const };
  if (pct > 0) return { text: `+${pct}%`, tone: 'up' as const };
  return { text: `${pct}%`, tone: 'down' as const };
}

export default function AdminDashboardPage() {
  const [artists, setArtists] = useState<UserProfile[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    void Promise.all([
      apiGet<UserProfile[]>('/users/admin/artists', token),
      apiGet<Work[]>('/works/admin/all', token),
      apiGet<ActivityLog[]>('/activity/admin/recent?limit=6', token),
    ])
      .then(([artistList, workList, logs]) => {
        setArtists(artistList);
        setWorks(workList);
        setActivities(logs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Chargement impossible');
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingArtists = useMemo(
    () => artists.filter((a) => a.verificationStatus === 'pending'),
    [artists],
  );
  const published = useMemo(
    () => works.filter((w) => (w.moderationStatus || 'published') === 'published'),
    [works],
  );
  const featured = useMemo(() => published.filter((w) => w.isFeatured), [published]);

  const workDates = useMemo(
    () =>
      published
        .map((w) => (w.createdAt ? new Date(w.createdAt) : null))
        .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime()))),
    [published],
  );

  const pendingDates = useMemo(
    () =>
      pendingArtists
        .map((a) => (a.createdAt ? new Date(a.createdAt) : null))
        .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime()))),
    [pendingArtists],
  );

  const artistDates = useMemo(
    () =>
      artists
        .map((a) => (a.createdAt ? new Date(a.createdAt) : null))
        .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime()))),
    [artists],
  );

  const metrics = useMemo(() => {
    const weekStart = daysAgo(7);
    const prevStart = daysAgo(14);
    const artistsWeek = countInRange(artistDates, weekStart, new Date());
    const artistsPrev = countInRange(artistDates, prevStart, weekStart);
    const pendingWeek = countInRange(pendingDates, weekStart, new Date());
    const pendingPrev = countInRange(pendingDates, prevStart, weekStart);
    const publishedWeek = countInRange(workDates, weekStart, new Date());
    const publishedPrev = countInRange(workDates, prevStart, weekStart);
    const featuredTrend =
      featured.length === 0 ? { text: 'Stable', tone: 'stable' as const } : { text: 'Actif', tone: 'up' as const };

    return {
      artists: {
        value: artists.length,
        trend: trendLabel(artistsWeek || artists.length, artistsPrev || 0),
      },
      pending: {
        value: pendingArtists.length,
        trend: trendLabel(pendingWeek || pendingArtists.length, pendingPrev || 0),
      },
      featured: {
        value: featured.length,
        trend: featuredTrend,
      },
      published: {
        value: published.length,
        trend: trendLabel(publishedWeek || published.length, publishedPrev || 0),
      },
    };
  }, [
    artists.length,
    artistDates,
    pendingArtists.length,
    pendingDates,
    featured.length,
    published.length,
    workDates,
  ]);

  const weekBars = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0 = dimanche
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + mondayOffset);

    const bars = DAY_LABELS.map((label, i) => {
      const start = new Date(mondayDate);
      start.setDate(mondayDate.getDate() + i);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const count = countInRange(workDates, start, end);
      return { label, count, isToday: start.getTime() === today.getTime() };
    });
    const max = Math.max(1, ...bars.map((b) => b.count));
    return bars.map((b) => ({
      ...b,
      height: b.count === 0 ? 18 : Math.max(22, Math.round((b.count / max) * 100)),
    }));
  }, [workDates]);

  const specialties = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of artists) {
      const key = (a.discipline || 'Autre').trim() || 'Autre';
      map.set(key, (map.get(key) || 0) + 1);
    }
    const total = artists.length || 1;
    return [...map.entries()]
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [artists]);

  const oldestPending = useMemo(() => {
    if (pendingArtists.length === 0) return null;
    return [...pendingArtists].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    })[0];
  }, [pendingArtists]);

  const pendingDays = useMemo(() => {
    if (!oldestPending?.createdAt) return 0;
    const ms = Date.now() - new Date(oldestPending.createdAt).getTime();
    return Math.max(0, Math.floor(ms / 86_400_000));
  }, [oldestPending]);

  return (
    <div className="admin-dash">
      <header className="admin-dash-head">
        <div>
          <h1 className="admin-h1">Vue d&apos;ensemble</h1>
          <p className="admin-muted">
            Tableau de bord Amani — centre de pilotage opérationnel et sélection éditoriale.
          </p>
        </div>
        <Link href="/publier" className="admin-btn admin-btn-primary admin-dash-cta">
          <Plus size={15} />
          Nouveau Contenu
        </Link>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Chargement des indicateurs…</p>
      ) : (
        <>
          <div className="admin-dash-metrics">
            <Link href="/admin/artistes" className="admin-dash-metric is-teal">
              <div className="admin-dash-metric-copy">
                <p className="admin-dash-metric-label">Artistes</p>
                <p className="admin-dash-metric-value">{metrics.artists.value}</p>
                <span className={`admin-dash-trend is-${metrics.artists.trend.tone}`}>
                  {metrics.artists.trend.text}
                </span>
              </div>
              <span className="admin-dash-metric-icon" aria-hidden>
                <Users size={68} />
              </span>
            </Link>
            <Link href="/admin/artistes" className="admin-dash-metric is-forest">
              <div className="admin-dash-metric-copy">
                <p className="admin-dash-metric-label">Artistes en Attente</p>
                <p className="admin-dash-metric-value">{metrics.pending.value}</p>
                <span className={`admin-dash-trend is-${metrics.pending.trend.tone}`}>
                  {metrics.pending.trend.text}
                </span>
              </div>
              <span className="admin-dash-metric-icon" aria-hidden>
                <Clipboard size={68} />
              </span>
            </Link>
            <Link href="/admin/selection" className="admin-dash-metric is-slate">
              <div className="admin-dash-metric-copy">
                <p className="admin-dash-metric-label">Œuvres en Avant</p>
                <p className="admin-dash-metric-value">{metrics.featured.value}</p>
                <span className={`admin-dash-trend is-${metrics.featured.trend.tone}`}>
                  {metrics.featured.trend.text}
                </span>
              </div>
              <span className="admin-dash-metric-icon" aria-hidden>
                <Star size={68} />
              </span>
            </Link>
            <Link href="/admin/selection" className="admin-dash-metric is-bronze">
              <div className="admin-dash-metric-copy">
                <p className="admin-dash-metric-label">Œuvres Publiées</p>
                <p className="admin-dash-metric-value">{metrics.published.value}</p>
                <span className={`admin-dash-trend is-${metrics.published.trend.tone}`}>
                  {metrics.published.trend.text}
                </span>
              </div>
              <span className="admin-dash-metric-icon" aria-hidden>
                <CheckCircle size={68} />
              </span>
            </Link>
          </div>

          <div className="admin-dash-grid">
            <div className="admin-dash-main">
              <section className="admin-dash-card">
                <div className="admin-dash-card-head">
                  <h2 className="admin-dash-card-title">Statistiques de Performance</h2>
                  <span className="admin-dash-chip">7 derniers jours</span>
                </div>

                <div className="admin-dash-perf">
                  <div>
                    <p className="admin-dash-subhead">Évolution des publications</p>
                    <div className="admin-dash-bars" role="img" aria-label="Publications par jour">
                      {weekBars.map((bar) => (
                        <div key={bar.label} className="admin-dash-bar-col">
                          <div
                            className={`admin-dash-bar${bar.isToday ? ' is-today' : ''}${
                              bar.count === 0 ? ' is-empty' : ''
                            }`}
                            style={{ height: `${bar.height}%` }}
                            title={`${bar.count} publication${bar.count > 1 ? 's' : ''}`}
                          />
                          <span>{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="admin-dash-subhead">Artistes par spécialité</p>
                    {specialties.length === 0 ? (
                      <p className="admin-muted">Aucun artiste pour le moment.</p>
                    ) : (
                      <ul className="admin-dash-specialty">
                        {specialties.map((item, idx) => (
                          <li key={item.label}>
                            <div className="admin-dash-specialty-meta">
                              <span>{item.label}</span>
                              <strong>{item.pct}%</strong>
                            </div>
                            <div className="admin-dash-track">
                              <div
                                className={`admin-dash-fill tone-${idx}`}
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              <section className="admin-dash-card">
                <div className="admin-dash-card-head">
                  <h2 className="admin-dash-card-title">Journal d&apos;Activite Recent</h2>
                  <Link href="/admin/journal" className="admin-dash-link">
                    Voir tout le journal
                  </Link>
                </div>
                {activities.length === 0 ? (
                  <p className="admin-muted">Aucune activite pour le moment.</p>
                ) : (
                  <ul className="admin-dash-journal">
                    {activities.map((item, idx) => {
                      const name = item.actorLabel || item.subjectLabel || 'Amani';
                      const tone = AVATAR_TONES[idx % AVATAR_TONES.length];
                      const isNew =
                        item.createdAt &&
                        Date.now() - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000;
                      return (
                        <li key={item.id}>
                          <span className={`admin-dash-avatar is-${tone}`} aria-hidden>
                            {initials(name)}
                          </span>
                          <div className="admin-dash-journal-body">
                            <p>{item.message}</p>
                            <p className="admin-muted">
                              {formatActivityWhen(item.createdAt)}
                              {item.actorLabel ? ` · par ${item.actorLabel}` : ''}
                            </p>
                          </div>
                          {isNew && idx === 0 && (
                            <span className="admin-dash-badge">Nouveau</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            <aside className="admin-dash-side">
              <section className="admin-dash-card">
                <h2 className="admin-dash-card-title">Actions rapides</h2>
                <div className="admin-dash-quick">
                  <Link href="/admin/artistes" className="admin-dash-quick-primary">
                    <span>
                      Valider des artistes
                      {pendingArtists.length > 0 ? ` (${pendingArtists.length})` : ''}
                    </span>
                    <AngleRight size={16} />
                  </Link>
                  <Link href="/admin/selection" className="admin-dash-quick-btn">
                    <span>Gérer les publications</span>
                    <AngleRight size={16} />
                  </Link>
                  <Link href="/" className="admin-dash-quick-btn">
                    <span>Voir l&apos;accueil public</span>
                    <ExternalLink size={15} />
                  </Link>
                </div>
              </section>

              <section className="admin-dash-urgent">
                <h2 className="admin-dash-card-title">Taches Urgentes</h2>
                <div className="admin-dash-urgent-list">
                  {oldestPending ? (
                    <article className="admin-dash-alert is-danger">
                      <p className="admin-dash-alert-title">Validation requise</p>
                      <p>
                        Le dossier de {oldestPending.fullName} est en attente
                        {pendingDays > 0 ? ` depuis ${pendingDays} jour${pendingDays > 1 ? 's' : ''}` : ''}.
                      </p>
                      <Link href="/admin/artistes">Examiner maintenant ›</Link>
                    </article>
                  ) : (
                    <article className="admin-dash-alert is-ok">
                      <p className="admin-dash-alert-title">File a jour</p>
                      <p>Aucun artiste en attente de validation.</p>
                    </article>
                  )}

                  {featured.length === 0 ? (
                    <article className="admin-dash-alert is-warn">
                      <p className="admin-dash-alert-title">Sélection vide</p>
                      <p>Aucune œuvre n&apos;est actuellement mise en avant sur le site public.</p>
                      <Link href="/admin/selection">Ajouter des œuvres ›</Link>
                    </article>
                  ) : (
                    <article className="admin-dash-alert is-ok">
                      <p className="admin-dash-alert-title">Sélection active</p>
                      <p>
                        {featured.length} œuvre{featured.length > 1 ? 's' : ''} en avant sur
                        l&apos;accueil.
                      </p>
                      <Link href="/admin/selection">Gérer la sélection ›</Link>
                    </article>
                  )}
                </div>
              </section>

              <section className="admin-dash-system">
                <p className="admin-dash-system-status">
                  <span className="admin-dash-dot" aria-hidden />
                  Statut Système : <strong>OPÉRATIONNEL</strong>
                </p>
                <p>API Amani · Panel admin</p>
                <p>Version : 1.0.0-amani</p>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
