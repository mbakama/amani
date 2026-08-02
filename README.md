# Amani

Plateforme de partage artistique pour les musiciens, slameurs et poetes baha'is de RDC.

## Structure

- `backend/` — API NestJS (auth, artistes, oeuvres, evenements)
- `frontend/` — Application Next.js (PWA), 4 ecrans : accueil, profil, publication, evenements

## Demarrage rapide

### 1. Backend

    cd backend
    cp .env.example .env   # DATABASE_*, JWT_SECRET, GOOGLE_CLIENT_ID (optionnel)
    npm install
    npm run start:dev      # API sur http://localhost:3001

Necessite une base PostgreSQL (locale ou hebergee, ex. Railway).

### 2. Frontend

    cd frontend
    cp .env.example .env.local
    npm install
    npm run dev             # App sur http://localhost:3000

## Ce qui est deja fonctionnel

- Modele de donnees "oeuvre" generique (musique / slam / poeme) — evolutif sans refonte, voir `backend/src/works/entities/work.entity.ts`
- Deux niveaux de compte : artiste (valide par un admin) et visiteur (inscription legere, requise pour rejoindre un live)
- 4 ecrans frontend connectes a l'API : accueil, profil, publication, evenements
- Selection editoriale hebdomadaire (`isFeatured` sur les oeuvres)
- Auth email/mot de passe + Google Sign-In (JWT)
- Routes : `/connexion`, `/inscription`, `/profil/moi` (profil connecte)
- Espace admin `/admin` — panel (sidebar, artistes, selection editoriale)
- **PWA** : installable (manifest + service worker), page hors-ligne `/offline`

### Installer l'app (PWA)

1. Build de production (le SW n'est pas actif en `next dev`) :

       cd frontend
       npm run build
       npm start

2. Ouvre `http://localhost:3000` (ou ton URL HTTPS en prod).
3. Sur mobile : menu du navigateur → **Ajouter a l'ecran d'accueil** / Installer.
4. Sur Chrome desktop : icone d'installation dans la barre d'adresse.

## Compte admin

Dans `backend/.env` :

    ADMIN_EMAIL=ton@email.com
    ADMIN_PASSWORD=motdepassefort
    ADMIN_NAME=Admin Amani

Au demarrage de l'API, le compte est cree (ou mis a jour) avec le role `admin`.
Connecte-toi ensuite sur `/profil/moi`, puis ouvre `/admin`.

## Prochaines etapes suggerees

- Upload reel des fichiers vers Cloudflare R2 (aujourd'hui upload local dans `backend/uploads/`)
- Vraies notifications push pour les rappels d'evenements

Voir `cahier-des-charges-amani.md` pour le detail des decisions produit.
