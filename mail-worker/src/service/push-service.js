import KvConst from '../const/kv-const';
import { importPrivateKey, signVapidJwt } from '../utils/vapid-utils';

const pushService = {

	/**
	 * Save a browser push subscription for a user.
	 * Stored as an array to support multiple devices per user.
	 */
	async subscribe(c, userId, subscription) {
		const key = KvConst.PUSH_SUB + userId;
		let subs = await c.env.kv.get(key, { type: 'json' }) || [];

		// Replace existing subscription for this endpoint if present
		subs = subs.filter(s => s.endpoint !== subscription.endpoint);
		subs.push(subscription);

		// Keep at most 10 devices per user
		if (subs.length > 10) subs = subs.slice(-10);

		await c.env.kv.put(key, JSON.stringify(subs));
	},

	/**
	 * Remove all push subscriptions for a user (sign-out).
	 */
	async unsubscribe(c, userId, endpoint) {
		const key = KvConst.PUSH_SUB + userId;
		let subs = await c.env.kv.get(key, { type: 'json' }) || [];
		if (endpoint) {
			subs = subs.filter(s => s.endpoint !== endpoint);
		} else {
			subs = [];
		}
		await c.env.kv.put(key, JSON.stringify(subs));
	},

	/**
	 * Send a Web Push notification to all subscriptions for a user.
	 * Errors are caught and logged — they never affect email delivery.
	 */
	async notify(c, userId, emailRow) {
		try {
			const vapidPublicKey = c.env.VAPID_PUBLIC_KEY;
			const vapidPrivateKey = c.env.VAPID_PRIVATE_KEY;

			// If VAPID keys aren't configured, skip silently
			if (!vapidPublicKey || !vapidPrivateKey) return;

			const key = KvConst.PUSH_SUB + userId;
			const subs = await c.env.kv.get(key, { type: 'json' });
			if (!subs || subs.length === 0) return;

			const privateKey = await importPrivateKey(vapidPrivateKey);

			const payload = JSON.stringify({
				title: emailRow.name || emailRow.sendEmail || 'New Email',
				body: emailRow.subject || '(no subject)',
				tag: emailRow.toEmail || String(emailRow.accountId),
				emailId: emailRow.emailId,
			});

			const expiredEndpoints = [];

			await Promise.all(subs.map(async (sub) => {
				try {
					const url = new URL(sub.endpoint);
					const audience = `${url.protocol}//${url.host}`;
					const jwt = await signVapidJwt(audience, 'mailto:admin@cloudmail.app', privateKey);

					const headers = {
						'Content-Type': 'application/json',
						'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
						'TTL': '86400',
					};

					const res = await fetch(sub.endpoint, {
						method: 'POST',
						headers,
						body: payload,
					});

					// 410 Gone or 404 means subscription is no longer valid
					if (res.status === 410 || res.status === 404) {
						expiredEndpoints.push(sub.endpoint);
					}
				} catch (e) {
					console.error('Push send error:', e.message);
				}
			}));

			// Clean up expired subscriptions
			if (expiredEndpoints.length > 0) {
				const freshSubs = subs.filter(s => !expiredEndpoints.includes(s.endpoint));
				await c.env.kv.put(key, JSON.stringify(freshSubs));
			}

		} catch (e) {
			// Never let push errors bubble up and break email delivery
			console.error('Push notify error:', e.message);
		}
	},

};

export default pushService;
