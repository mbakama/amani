'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AngleLeft,
  AngleRight,
  ArrowUp,
  Ban,
  Check,
  Clock,
  FilterSlash,
  History,
  List,
  Pencil,
  Refresh,
  Search,
  Users,
  VolumeUp,
} from '@primeicons/react';
import {
  apiGet,
  type ActivityListResult,
  type ActivityLog,
  type ActivityType,
} from '../../../lib/api';
import { getToken } from '../../../lib/auth';
import { formatRelativeWhen } from '../../../lib/relativeTime';

type ScopeFilter = 'all' | 'artists' | 'works' | ActivityType;

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<ActivityType, string> = {
  artist_registered: 'Inscription',
  artist_verified: 'Validation',
  artist_rejected: 'Refus',
  artist_blocked: 'Blocage',
  artist_unblocked: 'Deblocage',
  work_published: 'Publication',
  work_featured: 'Mise en avant',
  work_unfeatured: 'Retrait avant',
  work_removed: 'Retrait œuvre',
  work_restored: 'Restauration',
};

type Tone = 'up' | 'ok' | 'edit' | 'warn' | 'pending';

const TYPE_TONE: Record<ActivityType, Tone> = {
  artist_registered: 'pending',
  artist_verified: 'ok',
  artist_rejected: 'warn',
  artist_blocked: 'warn',
  artist_unblocked: 'ok',
  work_published: 'up',
  work_featured: 'ok',
  work_unfeatured: 'edit',
  work_removed: 'warn',
  work_restored: 'ok',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === 'up') return <ArrowUp size={14} />;
  if (tone === 'warn') return <Ban size={14} />;
  if (tone === 'ok') return <Check size={14} />;
  if (tone === 'pending') return <Users size={14} />;
  return <Pencil size={14} />;
}

export default function AdminJournalPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [scope, debouncedQuery]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        type: scope,
      });
      if (debouncedQuery) params.set('q', debouncedQuery);
      const result = await apiGet<ActivityListResult>(`/activity/admin?${params}`, token);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [page, scope, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  const counts = useMemo(() => {
    return {
      shown: items.length,
      total,
    };
  }, [items.length, total]);

  function resetFilters() {
    setScope('all');
    setQuery('');
    setPage(1);
  }

  return (
    <div className="admin-artists admin-journal">
      <header className="admin-artists-head">
        <div>
          <p className="admin-pubs-eyebrow">
            <History size={13} aria-hidden />
            Historique système
          </p>
          <h1 className="admin-h1">Journal d&apos;activite</h1>
          <p className="admin-muted admin-artists-sub">
            <Clock size={14} aria-hidden />
            Toutes les actions artistes et publications, du plus recent au plus ancien
          </p>
        </div>
        <div className="admin-pubs-actions">
          <button type="button" className="admin-btn" onClick={() => void load()}>
            <Refresh size={15} />
            Actualiser
          </button>
          <Link href="/admin/selection" className="admin-btn admin-btn-primary">
            <VolumeUp size={15} />
            Publications
          </Link>
        </div>
      </header>

      <div className="admin-pubs-metrics">
        <article className="admin-dash-metric is-forest">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Événements</p>
            <p className="admin-dash-metric-value">{counts.total}</p>
            <span className="admin-dash-trend is-stable">Total</span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <History size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-slate">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Page courante</p>
            <p className="admin-dash-metric-value">{counts.shown}</p>
            <span className="admin-dash-trend is-stable">Affichés</span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <List size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-bronze">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Pagination</p>
            <p className="admin-dash-metric-value">
              {currentPage}
              <span className="admin-journal-page-total">/{totalPages}</span>
            </p>
            <span className="admin-dash-trend is-stable">Page</span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Clock size={68} />
          </span>
        </article>
        <article className="admin-dash-metric is-mist">
          <div className="admin-dash-metric-copy">
            <p className="admin-dash-metric-label">Par page</p>
            <p className="admin-dash-metric-value">{PAGE_SIZE}</p>
            <span className="admin-dash-trend is-stable">Limite</span>
          </div>
          <span className="admin-dash-metric-icon" aria-hidden>
            <Search size={68} />
          </span>
        </article>
      </div>

      <div className="admin-artists-toolbar">
        <label className="admin-artists-search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher message, acteur, sujet…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ScopeFilter)}
          aria-label="Filtrer par type"
        >
          <option value="all">Portée : Toutes</option>
          <option value="artists">Portée : Artistes</option>
          <option value="works">Portée : Publications</option>
          <option value="artist_registered">Type : Inscription</option>
          <option value="artist_verified">Type : Validation</option>
          <option value="artist_rejected">Type : Refus</option>
          <option value="artist_blocked">Type : Blocage</option>
          <option value="work_published">Type : Publication</option>
          <option value="work_featured">Type : Mise en avant</option>
          <option value="work_removed">Type : Retrait œuvre</option>
          <option value="work_restored">Type : Restauration</option>
        </select>
        <button type="button" className="admin-btn admin-btn-sm admin-pubs-reset" onClick={resetFilters}>
          <FilterSlash size={14} />
          Réinitialiser
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Chargement du journal…</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-artists admin-table-journal">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Type</th>
                  <th>Acteur</th>
                  <th>Sujet</th>
                  <th>Quand</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <p className="admin-muted" style={{ padding: '0.5rem 0' }}>
                        Aucun événement ne correspond aux filtres.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const tone = TYPE_TONE[item.type] || 'edit';
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className={`admin-pubs-activity-item is-${tone}`} style={{ margin: 0 }}>
                            <span className="admin-pubs-activity-icon" aria-hidden>
                              <ToneIcon tone={tone} />
                            </span>
                            <div>
                              <p className="admin-strong">{item.message}</p>
                              <p className="admin-muted">{formatRelativeWhen(item.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="admin-badge">{TYPE_LABEL[item.type] || item.type}</span>
                        </td>
                        <td>
                          <p className="admin-cell">{item.actorLabel || '—'}</p>
                        </td>
                        <td>
                          {item.subjectUserId ? (
                            <Link href={`/profil/${item.subjectUserId}`} className="admin-cell-link">
                              {item.subjectLabel || 'Voir le profil'}
                            </Link>
                          ) : (
                            <p className="admin-cell">{item.subjectLabel || '—'}</p>
                          )}
                        </td>
                        <td>
                          <p className="admin-cell">{formatDateTime(item.createdAt)}</p>
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
              Affichage de {from}-{to} sur {total} événement{total > 1 ? 's' : ''}
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
        </>
      )}
    </div>
  );
}
