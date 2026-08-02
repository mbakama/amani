'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AngleRight,
  CheckCircle,
  Envelope,
  ExternalLink,
  Lock,
  MapMarker,
  Shield,
  Star,
  Users,
} from '@primeicons/react';
import ArtistAvatar from '../../../components/ArtistAvatar';
import { apiGet, apiPatch, type ActivityLog, type UserProfile } from '../../../lib/api';
import { clearSession, getToken, updateSessionUser } from '../../../lib/auth';
import { formatRelativeWhen } from '../../../lib/relativeTime';

export default function AdminProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myActivity, setMyActivity] = useState<ActivityLog[]>([]);

  const applyProfile = useCallback((me: UserProfile) => {
    setProfile(me);
    setFullName(me.fullName || '');
    setEmail(me.email || '');
    setCity(me.city || '');
    setBio(me.bio || '');
    setAvatarUrl(me.avatarUrl || '');
    setPassword('');
    updateSessionUser({
      id: me.id,
      fullName: me.fullName,
      role: me.role,
      verificationStatus: me.verificationStatus,
    });
  }, []);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/connexion');
      return;
    }
    try {
      const me = await apiGet<UserProfile>('/users/me', token);
      if (me.role !== 'admin') {
        router.replace('/profil/moi');
        return;
      }
      applyProfile(me);

      try {
        const logs = await apiGet<ActivityLog[]>('/activity/admin/recent?limit=20', token);
        setMyActivity(
          logs
            .filter((l) => l.actorId === me.id || l.actorLabel === me.fullName)
            .slice(0, 4),
        );
      } catch {
        setMyActivity([]);
      }
    } catch {
      clearSession();
      router.replace('/connexion');
    } finally {
      setLoading(false);
    }
  }, [router, applyProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await apiPatch<UserProfile>(
        '/users/me',
        {
          fullName: fullName.trim(),
          email: email.trim(),
          city: city.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          ...(password.trim() ? { password: password.trim() } : {}),
        },
        token,
      );
      applyProfile(updated);
      setSuccess('Profil mis a jour.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return <p className="admin-muted">Chargement du profil…</p>;
  }

  return (
    <div className="admin-profile">
      <header className="admin-dash-head">
        <div>
          <h1 className="admin-h1">Mon profil</h1>
          <p className="admin-muted">
            Identité administrateur, sécurité du compte et accès rapides au panel.
          </p>
        </div>
        <Link href="/admin" className="admin-btn admin-btn-primary admin-dash-cta">
          Vue d&apos;ensemble
          <AngleRight size={15} />
        </Link>
      </header>

      <div className="admin-profile-layout">
        <section className="admin-card admin-profile-main">
          <div className="admin-profile-row">
            <ArtistAvatar
              name={fullName || profile.fullName}
              size={72}
              src={avatarUrl || profile.avatarUrl}
            />
            <div>
              <p className="admin-profile-name">{fullName || profile.fullName}</p>
              <p className="admin-profile-role">
                <Shield size={13} aria-hidden />
                Administrateur Amani
              </p>
              <p className="admin-muted">{email || profile.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="admin-form">
            <div className="admin-profile-fields">
              <label className="admin-field">
                <span>Nom complet</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                />
              </label>

              <label className="admin-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Ville</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex. Kinshasa"
                />
              </label>

              <label className="admin-field">
                <span>URL avatar</span>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Courte présentation…"
              />
            </label>

            <label className="admin-field">
              <span>Nouveau mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="Laisser vide pour ne pas changer"
              />
            </label>

            {error && <p className="admin-error">{error}</p>}
            {success && <p className="admin-success">{success}</p>}

            <div className="admin-actions">
              <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <Link href="/" className="admin-btn">
                Voir le site public
              </Link>
            </div>
          </form>
        </section>

        <aside className="admin-profile-side">
          <section className="admin-dash-card">
            <h2 className="admin-dash-card-title">Compte</h2>
            <ul className="admin-profile-facts">
              <li>
                <span className="admin-profile-fact-icon" aria-hidden>
                  <Shield size={15} />
                </span>
                <div>
                  <p className="admin-profile-fact-label">Role</p>
                  <p className="admin-profile-fact-value">Administrateur</p>
                </div>
              </li>
              <li>
                <span className="admin-profile-fact-icon" aria-hidden>
                  <CheckCircle size={15} />
                </span>
                <div>
                  <p className="admin-profile-fact-label">Statut</p>
                  <p className="admin-profile-fact-value">
                    {profile.verificationStatus === 'verified' ? 'Actif' : profile.verificationStatus}
                  </p>
                </div>
              </li>
              <li>
                <span className="admin-profile-fact-icon" aria-hidden>
                  <Envelope size={15} />
                </span>
                <div>
                  <p className="admin-profile-fact-label">Email</p>
                  <p className="admin-profile-fact-value">{profile.email}</p>
                </div>
              </li>
              <li>
                <span className="admin-profile-fact-icon" aria-hidden>
                  <MapMarker size={15} />
                </span>
                <div>
                  <p className="admin-profile-fact-label">Ville</p>
                  <p className="admin-profile-fact-value">{city.trim() || 'Non renseignee'}</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="admin-dash-card">
            <h2 className="admin-dash-card-title">Accès rapides</h2>
            <div className="admin-dash-quick">
              <Link href="/admin/artistes" className="admin-dash-quick-btn">
                <span className="admin-profile-quick-label">
                  <Users size={15} aria-hidden />
                  Gérer les artistes
                </span>
                <AngleRight size={16} />
              </Link>
              <Link href="/admin/selection" className="admin-dash-quick-btn">
                <span className="admin-profile-quick-label">
                  <Star size={15} aria-hidden />
                  Publications
                </span>
                <AngleRight size={16} />
              </Link>
              <Link href="/" className="admin-dash-quick-btn">
                <span className="admin-profile-quick-label">
                  <ExternalLink size={15} aria-hidden />
                  Site public
                </span>
                <ExternalLink size={15} />
              </Link>
            </div>
          </section>

          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2 className="admin-dash-card-title">Mes actions récentes</h2>
              <Link href="/admin" className="admin-dash-link">
                Journal
              </Link>
            </div>
            {myActivity.length === 0 ? (
              <p className="admin-muted">Aucune action recente associee a ce compte.</p>
            ) : (
              <ul className="admin-profile-activity">
                {myActivity.map((item) => (
                  <li key={item.id}>
                    <p>{item.message}</p>
                    <p className="admin-muted">{formatRelativeWhen(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-profile-security">
            <p className="admin-profile-security-title">
              <Lock size={14} aria-hidden />
              Sécurité
            </p>
            <p>
              Utilise un mot de passe unique d&apos;au moins 8 caractères. Ne partage jamais ton
              accès admin.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
