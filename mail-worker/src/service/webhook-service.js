import settingService from './setting-service';
import { settingConst } from '../const/entity-const';
import BizError from '../error/biz-error';

const webhookService = {
	async sendEmailToWebhook(c, email) {
		const setting = await settingService.query(c);
		const { webhookUrl, webhookStatus, webhookSecret, webhookHeaders } = setting;

		if (webhookStatus !== settingConst.webhookStatus.OPEN || !webhookUrl) {
			return;
		}

		const urls = webhookUrl
			.split(/[\n,]/)
			.map(u => u.trim())
			.filter(Boolean);

		if (urls.length === 0) return;

		let customHeaders = {};
		if (webhookHeaders) {
			try {
				customHeaders = typeof webhookHeaders === 'string' ? JSON.parse(webhookHeaders) : webhookHeaders;
			} catch (e) {
				console.warn('Webhook headers parse failed:', e.message);
			}
		}

		let recipientList = [];
		try {
			recipientList = email.recipient ? JSON.parse(email.recipient) : [];
		} catch {
			recipientList = [];
		}

		let ccList = [];
		try {
			ccList = email.cc ? JSON.parse(email.cc) : [];
		} catch {
			ccList = [];
		}

		let bccList = [];
		try {
			bccList = email.bcc ? JSON.parse(email.bcc) : [];
		} catch {
			bccList = [];
		}

		const payload = {
			event: 'email.received',
			timestamp: new Date().toISOString(),
			emailId: email.emailId,
			to: email.toEmail,
			toName: email.toName,
			from: email.sendEmail,
			fromName: email.name,
			subject: email.subject,
			text: email.text,
			content: email.content,
			code: email.code,
			recipient: recipientList,
			cc: ccList,
			bcc: bccList,
			messageId: email.messageId,
			inReplyTo: email.inReplyTo,
			createTime: email.createTime
		};

		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': 'Cloud-Mail-Webhook/1.0',
			...customHeaders
		};

		if (webhookSecret) {
			headers['X-Webhook-Secret'] = webhookSecret;
			if (!headers['Authorization']) {
				headers['Authorization'] = `Bearer ${webhookSecret}`;
			}
		}

		await Promise.all(
			urls.map(async url => {
				try {
					const res = await fetch(url, {
						method: 'POST',
						headers,
						body: JSON.stringify(payload)
					});
					if (!res.ok) {
						console.error(`Webhook push failed status: ${res.status} url: ${url} response: ${await res.text()}`);
					}
				} catch (e) {
					console.error(`Webhook push error (${url}):`, e.message);
				}
			})
		);
	},

	async testWebhook(c, params) {
		const { webhookUrl, webhookSecret, webhookHeaders } = params;
		if (!webhookUrl) {
			throw new BizError('Webhook URL is required');
		}

		let customHeaders = {};
		if (webhookHeaders) {
			try {
				customHeaders = typeof webhookHeaders === 'string' ? JSON.parse(webhookHeaders) : webhookHeaders;
			} catch (e) {
				throw new BizError('Custom headers must be valid JSON');
			}
		}

		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': 'Cloud-Mail-Webhook/1.0',
			...customHeaders
		};

		if (webhookSecret) {
			headers['X-Webhook-Secret'] = webhookSecret;
			if (!headers['Authorization']) {
				headers['Authorization'] = `Bearer ${webhookSecret}`;
			}
		}

		const testPayload = {
			event: 'webhook.test',
			timestamp: new Date().toISOString(),
			message: 'Test event from Cloud Mail Webhook',
			email: {
				emailId: 999999,
				to: 'test@example.com',
				from: 'sender@example.com',
				subject: 'Webhook Test Notification',
				text: 'This is a test notification confirming that your webhook endpoint is configured successfully.',
				createTime: new Date().toISOString()
			}
		};

		const startTime = Date.now();
		try {
			const res = await fetch(webhookUrl, {
				method: 'POST',
				headers,
				body: JSON.stringify(testPayload)
			});
			const duration = Date.now() - startTime;
			const text = await res.text();
			return {
				status: res.status,
				ok: res.ok,
				duration,
				response: text.slice(0, 500)
			};
		} catch (e) {
			throw new BizError(`Webhook test request failed: ${e.message}`);
		}
	}
};

export default webhookService;
