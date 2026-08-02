# Prochaines étapes — Amani

Document de feuille de route.  
Aligné sur le [cahier des charges](cahier-des-charges-amani.md) et [SUITE.md](SUITE.md).

Ordre retenu :

1. **Notifications push** (rappels événements)
2. **Administration** (compléter le panel existant)
3. **Multilingue** (FR + lingala + swahili) — en dernier

---

## Phase 1 — Notifications push (rappels événements)

### État actuel

La cloche sur `/evenements` stocke des IDs dans `localStorage` (`amani_event_reminders`) — **aucune notification réelle**.

### Objectif

Web Push (PWA) : rappel ~**1 h avant** l’événement (MVP).

### Décisions

| Sujet | Choix |
|--------|--------|
| Canal | Web Push (VAPID) + service worker PWA |
| Compte | utilisateur connecté (visiteur ou artiste) |
| Déclencheur MVP | 1 h avant `startsAt` |
| Contenu | titre + lien vers événements |

### Livrables

**Backend**

- [ ] Entités `PushSubscription` + `EventReminder`
- [ ] `POST/DELETE /notifications/subscribe`
- [ ] Toggle rappel sur un événement
- [ ] Clés VAPID + envoi `web-push`
- [ ] Job planifié (cron) pour les rappels dus

**Frontend**

- [ ] Permission navigateur + enregistrement subscription
- [ ] Brancher la cloche sur l’API (plus seulement localStorage)
- [ ] Handlers `push` / `notificationclick` dans le SW

### Critères de done

- Cloche crée / supprime un rappel serveur
- Notification reçue ~1 h avant un événement de test (build PWA / HTTPS)

---

## Phase 2 — Administration (compléter le panel)

### Déjà en place

| Zone | Route |
|------|--------|
| Shell admin | `AdminShell` |
| Vue d’ensemble | `/admin` |
| Validation artistes | `/admin/artistes` |
| Publications (sélection + modération) | `/admin/selection` |
| Journal | `/admin/journal` |
| Profil admin | `/admin/profil` |

CDC couvert en partie : **valider les musiciens** + **modérer le contenu** (via Publications).

### À ajouter

- [ ] **Événements admin** — `/admin/evenements` : liste, annuler / masquer, statut live
- [ ] **File signalements** — vue prioritaire des œuvres `flagged` + badge nav
- [ ] **Polish dashboard** — alertes (artistes en attente, signalés, prochain live) + court doc ops

### Critères de done

- Pilotage des événements côté admin
- File signalements utilisable rapidement
- Parcours CDC : validation artiste + modération + events

---

## Phase 3 — Multilingue FR / LN / SW

### Objectif

Interface publique en français, lingala et swahili. Les contenus utilisateurs (titres, bios, poèmes) restent dans la langue de publication.

### Contrainte CDC (§7)

> Les traductions lingala/swahili sont assurées par des collaborateurs à recruter au sein de la communauté.

Le travail technique livre le **socle + FR complet + fichiers LN/SW prêts à remplir**, pas des traductions inventées présentées comme finales.

### Décisions

| Sujet | Choix |
|--------|--------|
| Lib | `next-intl` (Next.js 14 App Router) |
| Locales | `fr` (défaut), `ln`, `sw` |
| URLs | préfixe `as-needed` : `/` = FR, `/ln/...`, `/sw/...` |
| Périmètre | site public uniquement ; **admin reste en FR** |
| Fallback | clé absente en LN/SW → texte FR |

### Livrables techniques

- [ ] Installer next-intl, middleware, routing, déplacer le site sous `app/[locale]/...`
- [ ] `messages/fr.json` — source de vérité (toutes les chaînes UI)
- [ ] `messages/ln.json` et `messages/sw.json` — miroir des clés, scaffolds + fallback FR
- [ ] Brancher : nav, home, player, événements, auth, publier, profil
- [ ] Sélecteur de langue FR \| LN \| SW
- [ ] Dates / heures selon la locale active
- [ ] Textes notifications dans les catalogues i18n (FR + scaffolds LN/SW)
- [ ] Doc handoff traducteurs (`frontend/messages/README.md`)

### Critères de done (ingénierie)

- `/`, `/ln`, `/sw` fonctionnent
- UI publique via clés i18n ; `fr.json` complet
- Switcher persistant
- Admin inchangé en français

**Hors critère tech** : couverture 100 % LN/SW validée (dépend des collaborateurs).

---

## Hors scope (plus tard)

- Cloudflare R2 (remplacer `backend/uploads/`)
- Page détail événement publique
- Admin multilingue
- Notifications hors rappels événements
- Multi-administrateurs

---

## À prévoir aussi (produit)

### Rejoindre un événement en ligne

**Déjà en place :** bouton **Rejoindre** sur `/evenements` pour un live `online_live` **en cours** (`isLiveNow`), via `GET /events/:id/join` (compte visiteur ou artiste requis → ouvre le `streamUrl`).

**À améliorer :**

- [ ] Bouton plus visible sur les lives à venir (« Disponible quand le live démarre » / rappel)
- [ ] Accueil : le lien « Rejoindre » ouvre directement le live en cours (pas seulement `/evenements`)
- [ ] Message clair si non connecté → `/connexion` puis retour au live
- [ ] Page détail événement (optionnel) avec CTA Rejoindre

### Visiteur → devenir artiste

**Aujourd’hui :** le rôle se choisit **à l’inscription** uniquement. Un visiteur ne peut pas demander ensuite à devenir artiste (le profil le dit seulement).

**À faire (aligné CDC — validation admin) :**

- [ ] Sur `/profil/moi` : bouton **Devenir artiste**
- [ ] Formulaire : référence communauté / assemblée (comme à l’inscription)
- [ ] API : `POST /users/me/request-artist` → `role=artist`, `verificationStatus=pending`
- [ ] Admin : apparaît dans `/admin/artistes` comme les autres demandes
- [ ] Une fois validé : accès à `/publier` et annonces d’événements

---

## Phrase de reprise

> Continuer selon `PROCHAINES-ETAPES.md` : démarrer par la **Phase 1 — Notifications push**.
