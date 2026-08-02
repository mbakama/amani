# Suite Amani — où continuer

Document de reprise.  
Objectif : savoir **où on en est** et **quoi faire ensuite**.

---

## État actuel (fait)

- Backend NestJS + PostgreSQL (port `3001`)
- Frontend Next.js 14 (port `3000`) — style « paix verdoyante » (forêt / bronze)
- Auth : `/connexion`, `/inscription`, profil `/profil/moi`
- Publication `/publier`, lecture audio, événements `/evenements`
- PWA (production : `npm run build && npm start`)
- **Panel admin** `/admin` :
  - Shell dédié (sidebar, sans TopNav/BottomNav public)
  - `/admin/profil` — profil administrateur
  - `/admin` — vue d’ensemble (compteurs)
  - `/admin/artistes` — validation des demandes + activité récente
  - `/admin/selection` — mise en avant éditoriale
  - Table `activity_logs` — journal (inscription artiste, validation, sélection)

---

## Priorité suivante (hors admin)

1. **Cloudflare R2** — remplacer l’upload local `backend/uploads/`
2. **Notifications push** — rappels événements
3. **Page détail événement**
4. PWA — tester install téléphone (HTTPS / LAN + `npm start`)
5. Nettoyage œuvres « media manquant »

---

## Rappels techniques

| Sujet | Détail |
|--------|--------|
| Admin | `ADMIN_EMAIL` / `ADMIN_PASSWORD` (≥ 8 car.) / `ADMIN_NAME` dans `backend/.env` |
| API URL | `frontend/.env.local` → `NEXT_PUBLIC_API_URL` ; `backend/.env` → `API_PUBLIC_URL` |
| Panel admin | Se connecter en admin → `/admin` |

---

## Phrase de reprise

> Continuer Amani selon `SUITE.md` : prochaine étape **Cloudflare R2** (ou autre point listé).
