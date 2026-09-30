import { apiGet, apiPost, apiDelete } from './api';

export interface PushSubscriptionInfo {
  endpoint: string;
  p256dh: string;
  auth: string;
  expiresAt?: string;
}

let cachedVapidPublicKey: string | null = null;

export async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidPublicKey) {
    return cachedVapidPublicKey;
  }

  try {
    const response = await apiGet<{ publicKey: string | null }>(
      '/notifications/vapid-public-key',
    );
    cachedVapidPublicKey = response.publicKey;
    return response.publicKey;
  } catch (error) {
    console.error('Failed to fetch VAPID public key:', error);
    return null;
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Permission denied' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = await getVapidPublicKey();

    if (!vapidPublicKey) {
      return { success: false, error: 'VAPID key not available' };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
      throw new Error('Invalid subscription format');
    }

    const dto: PushSubscriptionInfo = {
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh!,
      auth: subscriptionJson.keys.auth!,
      expiresAt: subscriptionJson.expirationTime
        ? new Date(subscriptionJson.expirationTime).toISOString()
        : undefined,
    };

    await apiPost('/notifications/subscribe', dto, token);
    return { success: true };
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function unsubscribeFromPush(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await apiDelete('/notifications/subscribe', { endpoint: subscription.endpoint }, token);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getPushSubscriptionStatus(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Failed to check push subscription status:', error);
    return false;
  }
}
