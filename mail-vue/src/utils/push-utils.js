import { pushSubscribe, pushUnsubscribe } from '@/request/push.js';

const STORAGE_KEY = 'push_subscribed';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Request permission and subscribe the browser to Web Push.
 * Silently does nothing if:
 *   - Browser doesn't support push
 *   - User denies permission
 *   - VAPID public key is not configured
 *   - Already subscribed
 */
export async function initPush() {
    try {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) return; // VAPID not configured — skip silently

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed with same key
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            // Re-send to backend in case server lost it
            await pushSubscribe(existing.toJSON()).catch(() => {});
            localStorage.setItem(STORAGE_KEY, '1');
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await pushSubscribe(subscription.toJSON());
        localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
        // Never let push setup errors affect the rest of the app
        console.warn('Push subscription skipped:', e.message);
    }
}

/**
 * Unsubscribe from Web Push (call on logout).
 */
export async function removePush() {
    try {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
            await pushUnsubscribe(sub.endpoint).catch(() => {});
            await sub.unsubscribe();
        }
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Push unsubscribe error:', e.message);
    }
}
