# Notifications Push — Configuration

## Générer les clés VAPID

Les notifications push Web nécessitent des clés VAPID (Voluntary Application Server Identification) pour identifier le serveur d'application.

### Commande

Depuis le dossier `backend/` :

```bash
npx web-push generate-vapid-keys
```

### Sortie attendue

```
=============== VAPID keys ===============
Public Key:
BPxSvZiIm9lC...xyz123

Private Key:
abc456...def789
==========================================
```

### Configuration

Copier les clés dans `backend/.env` :

```bash
VAPID_PUBLIC_KEY=BPxSvZiIm9lC...xyz123
VAPID_PRIVATE_KEY=abc456...def789
VAPID_EMAIL=mailto:contact@amani.local
```

> ⚠️ **Important** : Ne jamais commit les clés privées VAPID dans le dépôt Git. Elles doivent rester secrètes et configurées via variables d'environnement.

## Test des notifications push

1. Lancer le backend avec les clés VAPID configurées
2. Build de production du frontend : `npm run build && npm start`
3. Ouvrir `http://localhost:3000/evenements` dans le navigateur
4. Se connecter et activer un rappel sur un événement (clic sur la cloche 🔔)
5. Accepter la permission de notifications
6. Le job cron vérifie les rappels dus toutes les 10 minutes

## Architecture

- **Backend** : `src/notifications/` — endpoints, service, scheduler, entités
- **Frontend** : `lib/push.ts` — utilitaires push, `public/sw-push.js` — service worker
- **Job cron** : Toutes les 10 minutes, envoie les rappels pour les événements dans 50-70 minutes
- **Nettoyage** : Toutes les heures, supprime les subscriptions expirées (410/404)

## Références

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
