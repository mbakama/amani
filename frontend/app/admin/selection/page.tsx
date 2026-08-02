'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AngleLeft,
  AngleRight,
  ArrowRight,
  ArrowUp,
  Ban,
  Box,
  ChartLine,
  Check,
  Eye,
  FilterSlash,
  Headphones,
  Image,
  InfoCircle,
  Microphone,
  Pencil,
  Plus,
  Refresh,
  Search,
  Star,
  StarFill,
  Undo,
  VolumeUp,
} from '@primeicons/react';
import {
  apiGet,
  apiPatch,
  type ActivityLog,
  type ActivityType,
  type ModerationStatus,
  type Work,
  type WorkType,
} from '../../../lib/api';
import { getToken } from '../../../lib/auth';
import { formatRelativeWhen } from '../../../lib/relativeTime';

type StatusFilter = 'all' | ModerationStatus;
type TypeFilter = 'all' | WorkType;
type PeriodFilter = 'all' | '7d' | '30d' | '90d';
type PrimeIcon = typeof Check;

const PAGE_SIZE = 8;

const TYPE_LABEL: Record<WorkType, string> = {
  music: 'Musique',
  slam: 'Slam',
  poem: 'Poème',
};

const STATUS_META: Record<
  ModerationStatus,
  { label: string; tone: 'published' | 'flagged' | 'removed' | 'featured' }
> = {
  published: { label: 'Publiée', tone: 'published' },
  flagged: { label: 'Signalée', tone: 'flagged' },
  removed: { label: 'Retirée', tone: 'removed' },
};

const TYPE_ICON: Record<WorkType, PrimeIcon> = {
  music: Headphones,
  slam: Microphone,
  poem: Image,
};

const WORK_ACTIVITY: ActivityType[] = [
  'work_published',
  'work_featured',
  'work_unfeatured',
  'work_removed',
  'work_restored',
];

const ACTIVITY_TONE: Partial<Record<ActivityType, 'up' | 'edit' | 'warn' | 'ok'>> = {
  work_published: 'up',
  work_featured: 'ok',
  work_unfeatured: 'edit',
  work_removed: 'warn',
  work_restored: 'ok',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatViews(count: number) {
  if (count >= 1000) {
    const k = count / 1000;
    const text = k >= 10 || count % 1000 === 0 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
    return `${text} VUES`;
  }
  return `${count} VUE${count > 1 ? 'S' : ''}`;
}

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
  if (previous === 0 && current === 0) return { text: '0%', tone: 'stable' as const };
  if (previous === 0) return { text: '+100%', tone: 'up' as const };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: '0%', tone: 'stable' as const };
  if (pct > 0) return { text: `+${pct}%`, tone: 'up' as const };
  return { text: `${pct}%`, tone: 'down' as const };
}

function periodStart(period: PeriodFilter) {
  if (period === '7d') return daysAgo(7);
  if (period === '30d') return daysAgo(30);
  if (period === '90d') return daysAgo(90);
  return null;
}

export default function AdminPublicationsPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      const [allWorks, logs] = await Promise.all([
        apiGet<Work[]>('/works/admin/all', token),
        apiGet<ActivityLog[]>('/activity/admin/recent?limit=12', token),
      ]);
      setWorks(allWorks);
      setActivities(logs.filter((a) => WORK_ACTIVITY.includes(a.type)).slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const published = works.filter((w) => (w.moderationStatus || 'published') === 'published');
    const featured = published.filter((w) => w.isFeatured);
    const removed = works.filter((w) => w.moderationStatus === 'removed');

    const weekStart = daysAgo(7);
    const prevStart = daysAgo(14);
    const publishedDates = published
      .map((w) => (w.createdAt ? new Date(w.createdAt) : null))
      .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime())));
    const removedDates = removed
      .map((w) => (w.createdAt ? new Date(w.createdAt) : null))
      .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime())));

    const pubWeek = countInRange(publishedDates, weekStart, new Date());
    const pubPrev = countInRange(publishedDates, prevStart, weekStart);
    const remWeek = countInRange(removedDates, weekStart, new Date());
    const remPrev = countInRange(removedDates, prevStart, weekStart);
    const featuredPct =
      published.length === 0
        ? { text: '0%', tone: 'stable' as const }
        : {
            text: `${Math.round((featured.length / published.length) * 100)}%`,
            tone: featured.length > 0 ? ('up' as const) : ('stable' as const),
          };

    return {
      published: published.length,
      featured: featured.length,
      removed: removed.length,
      all: works.length,
      publishedTrend: trendLabel(pubWeek || published.length, pubPrev || 0),
      featuredTrend: featuredPct,
      removedTrend: trendLabel(remWeek || removed.length, remPrev || 0),
      totalTrend: {
        text: `+${published.length}`,
        tone: published.length > 0 ? ('up' as const) : ('stable' as const),
      },
    };
  }, [works]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = periodStart(periodFilter);
    return works.filter((work) => {
      const status = work.moderationStatus || 'published';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (typeFilter !== 'all' && work.type !== typeFilter) return false;
      if (from && work.createdAt) {
        const created = new Date(work.createdAt);
        if (Number.isNaN(created.getTime()) || created < from) return false;
      } else if (from && !work.createdAt) {
        return false;
      }
      if (!q) return true;
      const hay = `${work.title} ${work.artist?.fullName || ''} ${work.city || ''} ${work.style || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [works, query, statusFilter, typeFilter, periodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, periodFilter, query]);

  function resetFilters() {
    setStatusFilter('published');
    setTypeFilter('all');
    setPeriodFilter('all');
    setQuery('');
    setPage(1);
  }

  async function refreshActivities(token: string) {
    try {
      const logs = await apiGet<ActivityLog[]>('/activity/admin/recent?limit=12', token);
      setActivities(logs.filter((a) => WORK_ACTIVITY.includes(a.type)).slice(0, 6));
    } catch {
      /* ignore */
    }
  }

  async function toggleFeatured(work: Work) {
    const token = getToken();
    if (!token) return;
    setBusyId(work.id);
    setError('');
    try {
      const updated = await apiPatch<Work>(
        `/works/${work.id}/feature`,
        { isFeatured: !work.isFeatured },
        token,
      );
      setWorks((list) =>
        list.map((w) =>
          w.id === work.id
            ? { ...w, isFeatured: updated.isFeatured, moderationStatus: updated.moderationStatus }
            : w,
        ),
      );
      await refreshActivities(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise en avant échouée');
    } finally {
      setBusyId(null);
    }
  }

  async function setModeration(work: Work, status: ModerationStatus) {
    const token = getToken();
    if (!token) return;
    setBusyId(work.id);
    setError('');
    try {
      const updated = await apiPatch<Work>(
        `/works/${work.id}/moderation`,
        { status },
        token,
      );
      setWorks((list) =>
        list.map((w) =>
          w.id === work.id
            ? {
                ...w,
                moderationStatus: updated.moderationStatus,
                isFeatured: updated.isFeatured,
              }
            : w,
        ),
      );
      await refreshActivities(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modération échouée');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-artists admin-pubs">
      <header className="admin-artists-head">
        <div>
          <p className="admin-pubs-eyebrow">
            <VolumeUp size={13} aria-hidden />
            Catalogue d&apos;œuvres
          </p>
          <h1 className="admin-h1">Publications des artistes</h1>
          <p className="admin-muted admin-artists-sub">
            <InfoCircle size={14} aria-hidden />
            Gérer les œuvres publiées : mise en avant, retrait, restauration
          </p>
        </div>
        <div className="admin-pubs-actions">
          <button type="button" className="admin-btn" onClick={() => void load()}>
            <Refresh size={15} />
            Actualiser
          </button>
          <Link href="/publier" className="admin-btn admin-btn-primary">
            <Plus size={15} />
            Nouvelle Publication
          </Link>
        </div>
      </header>

      <div className="admin-pubs-metrics">
        <article className="admin-dash-metric is-forest">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Publiées</p>
            <p className="admin-dash-metric-value">{counts.published}</p>
            <span className={`admin-dash-trend is-${counts.publishedTrend.tone}`}>
              {counts.publishedTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <ChartLine size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-bronze">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">En avant</p>
            <p className="admin-dash-metric-value">{counts.featured}</p>
            <span className={`admin-dash-trend is-${counts.featuredTrend.tone}`}>
              {counts.featuredTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Star size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-mist">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Retirées</p>
            <p className="admin-dash-metric-value">{counts.removed}</p>
            <span className={`admin-dash-trend is-${counts.removedTrend.tone}`}>
              {counts.removedTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Ban size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-slate">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Total œuvres</p>
            <p className="admin-dash-metric-value">{counts.all}</p>
            <span className={`admin-dash-trend is-${counts.totalTrend.tone}`}>
              {counts.totalTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Box size={68} />
          </span>
        </article>
      </div>

      <div className="admin-artists-toolbar">
        <label className="admin-artists-search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher titre, artiste, ville…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filtrer par statut"
        >
          <option value="all">Statut : Tous</option>
          <option value="published">Statut : Publiées</option>
          <option value="flagged">Statut : Signalées</option>
          <option value="removed">Statut : Retirées</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label="Filtrer par catégorie"
        >
          <option value="all">Catégorie : Toutes</option>
          <option value="music">Catégorie : Musique</option>
          <option value="slam">Catégorie : Slam</option>
          <option value="poem">Catégorie : Poème</option>
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
          aria-label="Filtrer par période"
        >
          <option value="all">Période : Toutes</option>
          <option value="7d">Période : 7 jours</option>
          <option value="30d">Période : 30 jours</option>
          <option value="90d">Période : 90 jours</option>
        </select>
        <button type="button" className="admin-btn admin-btn-sm admin-pubs-reset" onClick={resetFilters}>
          <FilterSlash size={14} />
          Réinitialiser
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Chargement…</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-artists admin-table-pubs">
              <thead>
                <tr>
                  <th>Œuvre</th>
                  <th>Artiste</th>
                  <th>Type / Cat.</th>
                  <th>Popularite</th>
                  <th>Statut</th>
                  <th>Date pub.</th>
                  <th className="admin-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <p className="admin-muted" style={{ padding: '0.5rem 0' }}>
                        Aucune publication ne correspond aux filtres.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((work) => {
                    const status = work.moderationStatus || 'published';
                    const busy = busyId === work.id;
                    const published = status === 'published';
                    const meta = STATUS_META[status];
                    const TypeIcon = TYPE_ICON[work.type] || Image;
                    const verified = work.artist?.verificationStatus === 'verified';
                    return (
                      <tr key={work.id} className={busy ? 'is-busy' : undefined}>
                        <td>
                          <div className="admin-person">
                            <span className={`admin-pubs-thumb is-${work.type}`} aria-hidden>
                              <TypeIcon size={16} />
                            </span>
                            <div className="admin-person-meta">
                              <p className="admin-strong">{work.title}</p>
                              <p className="admin-muted">
                                {work.style || work.city || TYPE_LABEL[work.type]}
                                {work.playCount != null ? ` · ${work.playCount} lect.` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-pubs-artist">
                            {work.artist?.id ? (
                              <Link href={`/profil/${work.artist.id}`} className="admin-cell-link">
                                {work.artist.fullName}
                              </Link>
                            ) : (
                              <p className="admin-cell">—</p>
                            )}
                            {verified && <span className="admin-pubs-verified">Vérifié</span>}
                          </div>
                        </td>
                        <td>
                          <span className="admin-badge">{TYPE_LABEL[work.type] || work.type}</span>
                        </td>
                        <td>
                          <p className="admin-pubs-views">{formatViews(work.playCount || 0)}</p>
                        </td>
                        <td>
                          <span
                            className={`admin-pubs-status admin-pubs-status-${
                              work.isFeatured && published ? 'featured' : meta.tone
                            }`}
                          >
                            {work.isFeatured && published ? 'En avant' : meta.label}
                          </span>
                        </td>
                        <td>
                          <p className="admin-cell">{formatDate(work.createdAt)}</p>
                        </td>
                        <td className="admin-col-actions">
                          <div className="admin-icon-actions">
                            {published && (
                              <button
                                type="button"
                                disabled={busy}
                                title={
                                  work.isFeatured ? 'Retirer de la sélection' : 'Mettre en avant'
                                }
                                aria-label={
                                  work.isFeatured
                                    ? 'Retirer de la sélection'
                                    : 'Mettre en avant'
                                }
                                onClick={() => void toggleFeatured(work)}
                                className={`admin-icon-action${
                                  work.isFeatured ? ' admin-icon-action-verified' : ''
                                }`}
                              >
                                {work.isFeatured ? <StarFill size={16} /> : <Star size={16} />}
                              </button>
                            )}
                            {work.artist?.id && (
                              <Link
                                href={`/profil/${work.artist.id}`}
                                className="admin-icon-action"
                                title="Voir / editer via le profil"
                                aria-label={`Editer via le profil de ${work.artist.fullName}`}
                              >
                                <Pencil size={16} />
                              </Link>
                            )}
                            {work.artist?.id && (
                              <Link
                                href={`/profil/${work.artist.id}`}
                                className="admin-icon-action"
                                title="Voir le profil"
                                aria-label={`Voir ${work.artist.fullName}`}
                              >
                                <Eye size={16} />
                              </Link>
                            )}
                            {published ? (
                              <button
                                type="button"
                                disabled={busy}
                                title="Retirer la publication"
                                aria-label="Retirer la publication"
                                onClick={() => void setModeration(work, 'removed')}
                                className="admin-icon-action admin-icon-action-rejected"
                              >
                                <Ban size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                title="Restaurer la publication"
                                aria-label="Restaurer la publication"
                                onClick={() => void setModeration(work, 'published')}
                                className="admin-icon-action admin-icon-action-verified"
                              >
                                <Undo size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-artists-pager">
            <p className="admin-muted">
              Affichage de {from}-{to} sur {filtered.length} œuvre
              {filtered.length > 1 ? 's' : ''}
              {statusFilter === 'published' ? ' publiées' : ''}
            </p>
            <div className="admin-artists-pages">
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Page precedente"
              >
                <AngleLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .map((n, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showGap = prev != null && n - prev > 1;
                  return (
                    <span key={n} className="admin-page-cluster">
                      {showGap && <span className="admin-muted">…</span>}
                      <button
                        type="button"
                        className={`admin-page-btn${n === currentPage ? ' is-active' : ''}`}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    </span>
                  );
                })}
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <AngleRight size={16} />
              </button>
            </div>
          </div>

          <div className="admin-artists-bottom">
            <section className="admin-card admin-artists-activity">
              <div className="admin-pubs-activity-head">
                <h2 className="admin-h2">Mises a jour catalogue</h2>
                <Link href="/admin/journal" className="admin-dash-link">
                  Journal complet
                </Link>
              </div>
              {activities.length === 0 ? (
                <p className="admin-muted">Aucune activite catalogue pour le moment.</p>
              ) : (
                <ul className="admin-pubs-activity-list">
                  {activities.map((item) => {
                    const tone = ACTIVITY_TONE[item.type] || 'edit';
                    return (
                      <li key={item.id} className={`admin-pubs-activity-item is-${tone}`}>
                        <span className="admin-pubs-activity-icon" aria-hidden>
                          {tone === 'up' ? (
                            <ArrowUp size={14} />
                          ) : tone === 'warn' ? (
                            <Ban size={14} />
                          ) : tone === 'ok' ? (
                            <Star size={14} />
                          ) : (
                            <Pencil size={14} />
                          )}
                        </span>
                        <div>
                          <p>{item.message}</p>
                          <p className="admin-muted">
                            {formatRelativeWhen(item.createdAt)}
                            {item.actorLabel ? ` · ${item.actorLabel}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <aside className="admin-pubs-promo">
              <span className="admin-pubs-promo-badge">Fonctionnalite Pro</span>
              <h2 className="admin-pubs-promo-title">Maximisez la visibilite des artistes</h2>
              <p>
                Utilisez l&apos;option &laquo;&nbsp;Mettre en avant&nbsp;&raquo; pour propulser les
                œuvres en haut de page sur le portail public.
              </p>
              <Link href="/" className="admin-pubs-promo-btn">
                En savoir plus
                <ArrowRight size={14} />
              </Link>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
