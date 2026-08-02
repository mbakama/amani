'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ArtistAvatar from '../ArtistAvatar';
import { ArrowLeftIcon, PlusCircleIcon } from '../icons/MediaIcons';
import WorkRow from '../WorkRow';
import { apiPatch, type UserProfile, type Work } from '../../lib/api';
import { getToken, updateSessionUser } from '../../lib/auth';

export default function ProfileView({
  profile,
  isSelf = false,
  onLogout,
  onProfileUpdate,
}: {
  profile: UserProfile;
  isSelf?: boolean;
  onLogout?: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [city, setCity] = useState(profile.city || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (editing) return;
    setFullName(profile.fullName || '');
    setEmail(profile.email || '');
    setCity(profile.city || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatarUrl || '');
    setPassword('');
  }, [profile, editing]);

  const allWorks: Work[] = (profile.works ?? []).map((w) => ({
    ...w,
    moderationStatus: w.moderationStatus || 'published',
    artist: { id: profile.id, fullName: profile.fullName, city: profile.city },
  }));

  // Visiteurs : seulement les oeuvres publiees. Proprietaire : tout + statut.
  const works = isSelf
    ? allWorks
    : allWorks.filter((w) => (w.moderationStatus || 'published') === 'published');

  const totalPlays = works.reduce((sum, w) => sum + (w.playCount || 0), 0);
  const isArtist = profile.role === 'artist' || profile.role === 'admin';
  const isPending = isArtist && profile.verificationStatus === 'pending';
  const isRejected = isArtist && profile.verificationStatus === 'rejected';
  const isBlocked = isArtist && profile.verificationStatus === 'blocked';
  const isVerified = isArtist && profile.verificationStatus === 'verified';
  const roleLabel =
    profile.role === 'admin'
      ? 'Administrateur'
      : isArtist
        ? profile.discipline || 'Artiste'
        : 'Visiteur';

  function openEdit() {
    setFullName(profile.fullName || '');
    setEmail(profile.email || '');
    setCity(profile.city || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatarUrl || '');
    setPassword('');
    setFormError('');
    setFormSuccess('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFormError('');
    setFormSuccess('');
    setPassword('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setFormError('');
    setFormSuccess('');
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
      updateSessionUser({
        id: updated.id,
        fullName: updated.fullName,
        role: updated.role,
        verificationStatus: updated.verificationStatus,
      });
      onProfileUpdate?.(updated);
      setFormSuccess('Profil mis a jour.');
      setPassword('');
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-fade pb-8">
      <header className="profile-hero">
        <div className="profile-hero-scrim" />
        <div className="profile-hero-top">
          {isSelf ? (
            <span className="profile-hero-nav-spacer" aria-hidden />
          ) : (
            <Link href="/" className="profile-hero-back" aria-label="Retour">
              <ArrowLeftIcon size={20} />
            </Link>
          )}
          <div className="profile-hero-actions">
            {isSelf && profile.role === 'admin' && (
              <Link href="/admin/profil" className="profile-hero-link">
                Panel admin
              </Link>
            )}
            {isSelf && onLogout ? (
              <button type="button" onClick={onLogout} className="profile-hero-link">
                Déconnexion
              </button>
            ) : null}
          </div>
        </div>

        <div className="profile-hero-copy">
          <p className="profile-hero-eyebrow">
            {isSelf ? 'Gestion du profil' : 'Profil public'}
          </p>
          <h1 className="profile-hero-title">
            {isSelf ? 'Mon profil' : 'Profil public'}
          </h1>
          <p className="profile-hero-sub">{profile.fullName}</p>
        </div>
      </header>

      <div className="profile-panel">
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <ArtistAvatar name={profile.fullName} size={88} src={profile.avatarUrl} />
          </div>

          <h2 className="profile-name">{profile.fullName}</h2>
          <div className="profile-meta">
            <span className="profile-role-badge">{roleLabel}</span>
            {profile.city ? <span className="profile-city">{profile.city}</span> : null}
          </div>
          {isSelf && profile.email ? (
            <p className="profile-email">{profile.email}</p>
          ) : null}

          {profile.bio?.trim() ? (
            <div className="profile-bio">
              <p className="profile-bio-label">À propos</p>
              <p className="profile-bio-text">{profile.bio.trim()}</p>
            </div>
          ) : null}

          {(isVerified || works.length > 0 || profile.role === 'admin') && (
            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{works.length}</strong>
                <span>œuvres</span>
              </div>
              <div className="profile-stat">
                <strong>{totalPlays}</strong>
                <span>écoutes</span>
              </div>
            </div>
          )}
        </div>

        {isSelf && !editing && (
          <div className="profile-edit-trigger">
            <button type="button" onClick={openEdit} className="profile-btn-secondary">
              Modifier mes informations
            </button>
          </div>
        )}

        {isSelf && editing && (
          <form onSubmit={handleSave} className="profile-edit-form">
            <p className="profile-edit-title">Modifier le profil</p>

            <label className="publish-field">
              <span className="publish-field-label">Nom complet</span>
              <input
                className="publish-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </label>

            <label className="publish-field">
              <span className="publish-field-label">Email</span>
              <input
                className="publish-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="publish-field">
              <span className="publish-field-label">Ville</span>
              <input
                className="publish-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex. Kinshasa"
              />
            </label>

            <label className="publish-field">
              <span className="publish-field-label">Bio</span>
              <textarea
                className="publish-input publish-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Courte présentation…"
              />
            </label>

            <label className="publish-field">
              <span className="publish-field-label">URL avatar</span>
              <input
                className="publish-input"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>

            <label className="publish-field">
              <span className="publish-field-label">Nouveau mot de passe</span>
              <input
                className="publish-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="Laisser vide pour ne pas changer"
              />
            </label>

            {formError ? <p className="profile-edit-error">{formError}</p> : null}
            {formSuccess ? <p className="profile-edit-success">{formSuccess}</p> : null}

            <div className="profile-edit-actions">
              <button type="submit" disabled={saving} className="profile-btn-primary">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" onClick={cancelEdit} className="profile-btn-secondary" disabled={saving}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {isPending && (
          <div className="profile-notice is-warn mt-6">
            <p className="text-sm font-medium text-[var(--amani-ink)]">Compte artiste en attente</p>
            <p className="mt-1 text-xs text-[var(--amani-forest)]">
              Un administrateur vérifiera ta référence communautaire.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="profile-notice is-danger mt-6">
            <p className="text-sm font-medium text-[var(--amani-ink)]">Demande artiste refusée</p>
            <p className="mt-1 text-xs text-[var(--amani-forest)]">
              Contacte l&apos;équipe Amani pour plus d&apos;informations.
            </p>
          </div>
        )}

        {isBlocked && (
          <div className="profile-notice is-danger mt-6">
            <p className="text-sm font-medium text-[var(--amani-ink)]">Compte bloqué</p>
            <p className="mt-1 text-xs text-[var(--amani-forest)]">
              La publication et certaines actions sont suspendues. Contacte l&apos;équipe Amani.
            </p>
          </div>
        )}

        {!isArtist && isSelf && (
          <div className="profile-notice mt-6">
            <p className="text-sm font-medium text-[var(--amani-ink)]">Compte visiteur</p>
            <p className="mt-1 text-xs text-[var(--amani-forest)]">
              Tu peux rejoindre les lives. Pour publier, demande un compte artiste à l&apos;inscription.
            </p>
          </div>
        )}

        {isSelf && (isVerified || profile.role === 'admin') && (
          <div className="mt-8">
            <Link
              href="/publier"
              className="profile-btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusCircleIcon size={18} />
              Publier une œuvre
            </Link>
          </div>
        )}

        {(isVerified || works.length > 0 || profile.role === 'admin') && (
          <section className="mt-10">
            <h2 className="profile-section-title">Catalogue</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--amani-forest)]/12 bg-white/60">
              {works.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[var(--amani-forest)]">
                  Aucune œuvre publiée pour le moment.
                </p>
              ) : (
                works.map((w) => (
                  <WorkRow
                    key={w.id}
                    work={w}
                    hideArtist
                    showStatus={isSelf}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
