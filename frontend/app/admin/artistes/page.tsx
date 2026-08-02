'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AngleLeft,
  AngleRight,
  Ban,
  CalendarPlus,
  Check,
  CheckCircle,
  Clipboard,
  Clock,
  Envelope,
  Eye,
  Refresh,
  Search,
  Spinner,
  Times,
  TimesCircle,
  Undo,
  Users,
} from '@primeicons/react';
import ArtistAvatar from '../../../components/ArtistAvatar';
import {
  apiGet,
  apiPatch,
  type ActivityLog,
  type ActivityType,
  type UserProfile,
  type VerificationStatus,
} from '../../../lib/api';
import { getToken } from '../../../lib/auth';
import { formatRelativeWhen } from '../../../lib/relativeTime';

type StatusFilter = 'all' | VerificationStatus;
type SortMode = 'newest' | 'oldest' | 'name';
type PrimeIcon = typeof Check;

/** Pastilles : Success / Pending / Submitted / Failed */
const STATUS_BADGE: Record<
  VerificationStatus,
  { label: string; Icon: PrimeIcon; tone: 'success' | 'pending' | 'submitted' | 'failed' }
> = {
  verified: { label: 'Success', Icon: CheckCircle, tone: 'success' },
  pending: { label: 'Pending', Icon: Spinner, tone: 'pending' },
  rejected: { label: 'Submitted', Icon: Envelope, tone: 'submitted' },
  blocked: { label: 'Failed', Icon: TimesCircle, tone: 'failed' },
};

function StatusBadge({ status }: { status: VerificationStatus }) {
  const badge = STATUS_BADGE[status];
  const spin = badge.tone === 'pending';
  return (
    <span className={`admin-status-pill admin-status-pill-${badge.tone}`}>
      <badge.Icon size={13} aria-hidden className={spin ? 'admin-status-spin' : undefined} />
      {badge.label}
    </span>
  );
}

const ACTIVITY_TONE: Partial<Record<ActivityType, 'pending' | 'verified' | 'rejected'>> = {
  artist_registered: 'pending',
  artist_verified: 'verified',
  artist_rejected: 'rejected',
  artist_blocked: 'rejected',
  artist_unblocked: 'verified',
  work_published: 'verified',
  work_featured: 'verified',
  work_unfeatured: 'pending',
  work_removed: 'rejected',
  work_restored: 'verified',
};

const PAGE_SIZE = 8;

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function AdminArtistesPage() {
  const [artists, setArtists] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      const [list, logs] = await Promise.all([
        apiGet<UserProfile[]>('/users/admin/artists', token),
        apiGet<ActivityLog[]>('/activity/admin/recent?limit=8', token),
      ]);
      setArtists(list);
      setActivities(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    artists.forEach((a) => {
      if (a.discipline?.trim()) set.add(a.discipline.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [artists]);

  const counts = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = artists.filter(
      (a) => a.createdAt && new Date(a.createdAt).getTime() >= weekAgo,
    ).length;
    const prevWeek = artists.filter((a) => {
      if (!a.createdAt) return false;
      const t = new Date(a.createdAt).getTime();
      return t >= twoWeeksAgo && t < weekAgo;
    }).length;
    const pending = artists.filter((a) => a.verificationStatus === 'pending').length;
    const verified = artists.filter((a) => a.verificationStatus === 'verified').length;
    const blocked = artists.filter((a) => a.verificationStatus === 'blocked').length;

    const trend = (current: number, previous: number) => {
      if (previous === 0 && current === 0) return { text: 'Stable', tone: 'stable' as const };
      if (previous === 0) return { text: '+100%', tone: 'up' as const };
      const pct = Math.round(((current - previous) / previous) * 100);
      if (pct === 0) return { text: 'Stable', tone: 'stable' as const };
      if (pct > 0) return { text: `+${pct}%`, tone: 'up' as const };
      return { text: `${pct}%`, tone: 'down' as const };
    };

    return {
      all: artists.length,
      pending,
      verified,
      rejected: artists.filter((a) => a.verificationStatus === 'rejected').length,
      blocked,
      recent,
      allTrend: trend(recent || artists.length, prevWeek || 0),
      pendingTrend: pending > 0 ? { text: 'A traiter', tone: 'up' as const } : { text: 'Stable', tone: 'stable' as const },
      verifiedTrend:
        verified > 0 ? { text: 'Actif', tone: 'up' as const } : { text: 'Stable', tone: 'stable' as const },
      blockedTrend:
        blocked > 0 ? { text: 'Attention', tone: 'down' as const } : { text: 'Stable', tone: 'stable' as const },
      recentTrend: trend(recent, prevWeek),
    };
  }, [artists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = artists.filter((a) => {
      if (statusFilter !== 'all' && a.verificationStatus !== statusFilter) return false;
      if (disciplineFilter !== 'all' && (a.discipline || '') !== disciplineFilter) return false;
      if (!q) return true;
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q) ||
        (a.verificationReference || '').toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortMode === 'name') return a.fullName.localeCompare(b.fullName, 'fr');
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortMode === 'oldest' ? ta - tb : tb - ta;
    });

    return list;
  }, [artists, statusFilter, disciplineFilter, query, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, disciplineFilter, query, sortMode]);

  async function setStatus(id: string, status: VerificationStatus) {
    const token = getToken();
    if (!token) return;
    const current = artists.find((a) => a.id === id);
    if (!current || current.verificationStatus === status) return;

    setBusyId(id);
    setError('');
    try {
      const updated = await apiPatch<UserProfile>(`/users/admin/${id}/verify`, { status }, token);
      setArtists((list) => list.map((a) => (a.id === id ? updated : a)));
      const logs = await apiGet<ActivityLog[]>('/activity/admin/recent?limit=8', token);
      setActivities(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise a jour impossible');
    } finally {
      setBusyId(null);
    }
  }

  function resetFilters() {
    setStatusFilter('all');
    setDisciplineFilter('all');
    setSortMode('newest');
    setQuery('');
    setPage(1);
  }

  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="admin-artists">
      <header className="admin-artists-head">
        <div>
          <h1 className="admin-h1">Gestion des artistes</h1>
          <p className="admin-muted admin-artists-sub">
            <Users size={14} aria-hidden />
            Listing des artistes enregistrés dans le système
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => void load()}>
          <Refresh size={15} />
          Actualiser
        </button>
      </header>

      <div className="admin-artists-stats">
        <article className="admin-dash-metric is-teal">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Total artistes</p>
            <p className="admin-dash-metric-value">{counts.all}</p>
            <span className={`admin-dash-trend is-${counts.allTrend.tone}`}>
              {counts.allTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Users size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-forest">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">En attente</p>
            <p className="admin-dash-metric-value">{counts.pending}</p>
            <span className={`admin-dash-trend is-${counts.pendingTrend.tone}`}>
              {counts.pendingTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Clipboard size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-slate">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Validés</p>
            <p className="admin-dash-metric-value">{counts.verified}</p>
            <span className={`admin-dash-trend is-${counts.verifiedTrend.tone}`}>
              {counts.verifiedTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Check size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-danger">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Bloqués</p>
            <p className="admin-dash-metric-value">{counts.blocked}</p>
            <span className={`admin-dash-trend is-${counts.blockedTrend.tone}`}>
              {counts.blockedTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Ban size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-bronze">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Nouvelles inscr.</p>
            <p className="admin-dash-metric-value">+{counts.recent}</p>
            <span className={`admin-dash-trend is-${counts.recentTrend.tone}`}>
              {counts.recentTrend.text}
            </span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <CalendarPlus size={68} />
          </span>
        </article>
      </div>

      <div className="admin-artists-toolbar">
        <label className="admin-artists-search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher par nom ou email…"
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
          <option value="verified">Success</option>
          <option value="pending">Pending</option>
          <option value="rejected">Submitted</option>
          <option value="blocked">Failed</option>
        </select>
        <select
          value={disciplineFilter}
          onChange={(e) => setDisciplineFilter(e.target.value)}
          aria-label="Filtrer par spécialité"
        >
          <option value="all">Spécialité : Toutes</option>
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          aria-label="Trier"
        >
          <option value="newest">Date : Plus récentes</option>
          <option value="oldest">Date : Plus anciennes</option>
          <option value="name">Nom : A → Z</option>
        </select>
        <button type="button" className="admin-btn admin-btn-sm" onClick={resetFilters}>
          <Undo size={14} />
          Réinitialiser
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Chargement…</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-artists">
              <thead>
                <tr>
                  <th>Artiste</th>
                  <th>Contact</th>
                  <th>Référence</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="admin-col-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p className="admin-muted" style={{ padding: '0.5rem 0' }}>
                        Aucun artiste ne correspond aux filtres.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((artist) => {
                    const status = artist.verificationStatus;
                    const busy = busyId === artist.id;
                    return (
                      <tr key={artist.id} className={busy ? 'is-busy' : undefined}>
                        <td>
                          <div className="admin-person">
                            <ArtistAvatar name={artist.fullName} size={36} src={artist.avatarUrl} />
                            <div className="admin-person-meta">
                              <p className="admin-strong">{artist.fullName}</p>
                              <p className="admin-muted">
                                {artist.discipline || 'Artiste'}
                                {artist.city ? ` · ${artist.city}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <a
                            href={`mailto:${artist.email}`}
                            className="admin-cell-link"
                            title={artist.email}
                          >
                            {artist.email}
                          </a>
                        </td>
                        <td>
                          <p
                            className="admin-cell admin-cell-clamp"
                            title={artist.verificationReference || undefined}
                          >
                            {artist.verificationReference || '—'}
                          </p>
                        </td>
                        <td>
                          <StatusBadge status={status} />
                        </td>
                        <td>
                          <p className="admin-cell">{formatDate(artist.createdAt)}</p>
                        </td>
                        <td className="admin-col-actions">
                          <div className="admin-icon-actions">
                            <Link
                              href={`/profil/${artist.id}`}
                              className="admin-icon-action"
                              title="Voir le profil"
                              aria-label={`Voir ${artist.fullName}`}
                            >
                              <Eye size={16} />
                            </Link>
                            {(status === 'pending' ||
                              status === 'rejected' ||
                              status === 'blocked') && (
                              <button
                                type="button"
                                disabled={busy}
                                title={status === 'blocked' ? 'Débloquer' : 'Valider'}
                                aria-label={status === 'blocked' ? 'Débloquer' : 'Valider'}
                                onClick={() => setStatus(artist.id, 'verified')}
                                className="admin-icon-action admin-icon-action-verified"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {status === 'pending' && (
                              <button
                                type="button"
                                disabled={busy}
                                title="Refuser"
                                aria-label="Refuser"
                                onClick={() => setStatus(artist.id, 'rejected')}
                                className="admin-icon-action admin-icon-action-rejected"
                              >
                                <Times size={16} />
                              </button>
                            )}
                            {status === 'verified' && (
                              <button
                                type="button"
                                disabled={busy}
                                title="Bloquer"
                                aria-label="Bloquer"
                                onClick={() => setStatus(artist.id, 'blocked')}
                                className="admin-icon-action admin-icon-action-rejected"
                              >
                                <Ban size={16} />
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
              Affichage de {from}-{to} sur {filtered.length} artiste
              {filtered.length > 1 ? 's' : ''}
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
                <h2 className="admin-h2">
                  <Clock size={15} aria-hidden />
                  Activités récentes
                </h2>
                <Link href="/admin/journal" className="admin-dash-link">
                  Journal complet
                </Link>
              </div>
              {activities.length === 0 ? (
                <p className="admin-muted">Aucune activite pour le moment.</p>
              ) : (
                <ul className="admin-activity-list">
                  {activities.map((item) => {
                    const tone = ACTIVITY_TONE[item.type] || 'pending';
                    return (
                      <li key={item.id} className={`admin-activity-item is-${tone}`}>
                        <span className="admin-activity-dot" aria-hidden />
                        <div>
                          <p>{item.message}</p>
                          <p className="admin-muted">
                            {formatRelativeWhen(item.createdAt)}
                            {item.actorLabel ? ` · par ${item.actorLabel}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <aside className="admin-artists-promo">
              <h2 className="admin-h2">Optimisez votre gestion</h2>
              <p>
                Filtre par statut, spécialité et date pour retrouver rapidement les demandes à
                valider avant publication.
              </p>
              <Link href="/admin" className="admin-btn admin-btn-primary admin-btn-sm">
                Voir le tableau de bord
              </Link>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
