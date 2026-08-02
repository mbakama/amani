# Amani — Backend (NestJS)

## Modules

- `users/` — comptes artistes et visiteurs, verification communautaire
- `works/` — modele generique d'oeuvre (musique / slam / poeme), evolutif
- `events/` — evenements et lives, acces au lien de diffusion reserve aux comptes connectes
- `auth/` — JWT, guards par role (`ArtistGuard`, `AdminGuard`)

## Notes importantes

- `synchronize: true` dans `app.module.ts` est pratique en developpement mais **a desactiver en production** au profit de vraies migrations TypeORM.
- Compte admin : renseigner `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` dans `.env` — cree ou mis a jour au demarrage de l'API.
