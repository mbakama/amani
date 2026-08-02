# Cahier des charges — Amani
### Plateforme de partage musical pour les musiciens baha'is de RDC

---

## 1. Contexte et objectif

Amani est une application web adaptée mobile (PWA) permettant aux musiciens baha'is de République Démocratique du Congo de partager leur musique — morceaux enregistrés, liens externes, et événements en direct — avec une audience ouverte à tous, sans compte requis pour écouter.

**Objectif principal :** créer un espace centralisé où le talent musical de la communauté baha'ie congolaise peut être découvert, écouté et célébré.

> **Exigence d'évolutivité :** l'application doit être conçue dès le départ pour accueillir, à terme, d'autres formes d'art encouragées par les écrits baha'is — slam, poésie, et potentiellement d'autres disciplines artistiques. Le MVP se concentre sur la musique, mais le modèle de données et l'architecture ne doivent pas être figés autour de ce seul type de contenu.

---

## 2. Utilisateurs

| Profil | Accès | Actions principales |
|---|---|---|
| **Musicien** | Compte requis, validé par un administrateur | Créer un profil, publier des morceaux (fichier ou lien), annoncer des événements/lives |
| **Visiteur / auditeur** | Aucun compte requis pour parcourir et écouter | Parcourir, écouter, filtrer par ville/style, voir les événements à venir |

> **Précision :** un compte visiteur simple (sans validation, juste une inscription légère — email ou numéro) est requis pour **rejoindre un live en cours**. La navigation, l'écoute des morceaux publiés et la consultation du calendrier d'événements restent accessibles sans compte.
| **Administrateur** | Compte réservé — une seule personne au lancement | Valider les inscriptions de musiciens, modérer le contenu |

> **Décision :** au lancement, l'administration est assurée par une seule personne (le porteur du projet). À l'inscription, un musicien doit fournir une preuve d'appartenance à la communauté baha'ie (ex. mention de sa communauté/assemblée locale ou un contact de référence), vérifiée manuellement avant validation du compte.

---

## 3. Fonctionnalités par écran

### 3.1 Accueil
- Fil des nouveautés (morceaux récemment publiés)
- Bandeau mis en avant pour l'événement/live le plus proche
- Rangée d'artistes à découvrir
- Recherche par nom d'artiste ou ville
- Lecture directe depuis la liste (pas besoin d'ouvrir le morceau)

### 3.2 Profil musicien
- Photo/avatar, nom, instrument ou style, ville
- Courte biographie
- Statistiques : nombre de morceaux, écoutes totales, lives à venir
- Liste des morceaux publiés (durée, nombre d'écoutes)

### 3.3 Publication (réservé aux musiciens)
- Trois modes de publication : fichier audio/vidéo, lien externe (YouTube, Spotify, SoundCloud), annonce de live
- Champs : titre, style musical, ville
- Formats acceptés : MP3, WAV, MP4 — taille limitée pour tenir compte d'une connexion internet parfois instable en RDC

### 3.4 Événements
- Bandeau "en direct" pour les lives en cours
- Liste des événements à venir, triable par date
- Notification/rappel activable par l'utilisateur
- Filtres : lives en ligne / événements sur place
- Rejoindre un live en cours nécessite une inscription visiteur légère (email ou numéro, sans validation)

---

## 4. Contraintes spécifiques au contexte RDC

- **Connectivité limitée et coûteuse** : privilégier un chargement progressif, la mise en cache, et une compression raisonnable des médias
- **PWA (Progressive Web App)** plutôt qu'application native : un seul code pour web et mobile, installable sans passer par un store, fonctionne partiellement hors-ligne
- **Modération humaine** : validation manuelle des comptes musiciens par un administrateur, pour garantir la confiance au sein de la communauté

---

## 5. Architecture technique proposée (à valider)

| Composant | Suggestion | Remarque |
|---|---|---|
| Frontend | Next.js (React) en PWA | Rendu côté serveur pour un chargement plus rapide sur connexion limitée ; support PWA via plugin (ex. next-pwa) |
| Backend | NestJS (framework Node.js structuré) | Organisation propre en modules (musiciens, morceaux, événements, administration) |
| Stockage médias | Service cloud (ex. object storage) avec compression — **décidé** | Solution retenue : plus économique à petite échelle et évolutive sans investissement matériel initial |
| Base de données | Relationnelle (utilisateurs, morceaux, événements) | |
| Authentification | Musiciens (validée) + visiteurs (légère, requise pour rejoindre un live) | Deux niveaux de compte distincts |

> **Conception évolutive :** pour permettre l'ajout futur d'autres formes d'art (slam, poésie...), la base de données doit traiter chaque publication comme une **œuvre** générique avec un **type** (musique, slam, poème, etc.), plutôt que de coder "morceau" en dur partout dans l'application. Chaque type peut avoir ses propres champs spécifiques (ex. durée pour la musique, texte intégral pour un poème), mais partage une structure commune : auteur, titre, ville, date, statut de modération. Ce choix évite une refonte complète du backend quand une nouvelle discipline sera ajoutée — seuls le formulaire de publication et l'affichage devront être adaptés par type.

*Cette section reste à affiner selon les compétences disponibles et le budget d'hébergement.*

---

## 6. Phasage proposé

### Estimation budgétaire (hébergement, phase MVP)

| Poste | Service suggéré | Coût estimé |
|---|---|---|
| Backend (NestJS + base de données) | Railway (plan Hobby) | ~5 à 8 $/mois |
| Frontend (Next.js) | Vercel (offre gratuite au démarrage) | 0 $/mois |
| Stockage audio/vidéo | Cloudflare R2 | 0 $ jusqu'à 10 Go, puis ~1,50 $/mois pour 100 Go (égress gratuit) |
| Nom de domaine | .app ou .org | ~10 à 15 $/an |

**Total estimé au lancement : ~5 à 10 $/mois**, hors nom de domaine. Ce chiffre évoluera avec le volume de contenu et d'écoutes — Cloudflare R2 étant retenu notamment parce qu'il ne facture pas la diffusion des fichiers (contrairement à des solutions comme AWS S3), ce qui limite le risque de dérapage budgétaire quand l'app grandit.

*Estimation établie en juillet 2026, à réévaluer avant le développement final.*

1. **Phase 1 — MVP** : profils musiciens, publication de morceaux (fichier + lien), écoute publique, validation admin, sélection éditoriale hebdomadaire (mise en avant de morceaux par l'administrateur)
2. **Phase 2** : événements/lives, notifications, filtres avancés
3. **Phase 3** : statistiques enrichies, mise en avant éditoriale, amélioration du mode hors-ligne
4. **Phase 4 — Extension artistique** : ouverture de la plateforme à d'autres disciplines encouragées par les écrits baha'is (slam, poésie...), en s'appuyant sur le modèle de données générique posé dès la phase 1

---

## 7. Décisions prises

- **Administration** : une seule personne (le porteur du projet) au lancement
- **Vérification des musiciens** : preuve d'appartenance à la communauté baha'ie requise à l'inscription (déclaration + contact de référence)
- **Stockage médias** : service cloud
- **Langues** : français, lingala et swahili dès le lancement
- **Mise en avant éditoriale** : intégrée dès la phase 1 — l'administrateur sélectionne chaque semaine des morceaux à mettre en avant sur l'écran d'accueil
- **Traductions lingala/swahili** : assurées par plusieurs collaborateurs à recruter au sein de la communauté

## 8. Questions encore ouvertes

- Quel fournisseur cloud privilégier, selon le budget disponible ? *(voir estimation section 6 — Cloudflare R2 recommandé)*

---

*Document de travail — à faire évoluer au fil des décisions du projet.*
