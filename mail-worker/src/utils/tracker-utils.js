import { parseHTML } from 'linkedom';

/**
 * Known email tracker / analytics domains.
 * These are checked against every external img src before storing.
 * Add more entries as new trackers are discovered.
 */
const TRACKER_DOMAINS = [
	// Mailchimp / Intuit
	'list-manage.com', 'mailchimp.com', 'mcusercontent.com',
	// Sendgrid / Twilio
	'sendgrid.net', 'sendgrid.com',
	// HubSpot
	'hubspot.com', 'hs-analytics.net', 'hsmail.net', 'hubspotemail.net',
	// Salesforce / ExactTarget / Pardot
	'exacttarget.com', 'salesforce.com', 'pardot.com', 'sfmc.co',
	// Marketo
	'marketo.com', 'mktoweb.com', 'mkto-',
	// Klaviyo
	'klaviyo.com', 'klaviyo-email.com',
	// Campaign Monitor
	'createsend.com', 'cmail1.com', 'cmail2.com', 'cmail3.com',
	'cmail4.com', 'cmail5.com', 'cmail6.com', 'cmail7.com',
	// ActiveCampaign
	'activecampaign.com', 'ac-email.net',
	// ConvertKit / Kit
	'convertkit.com', 'convertkit-mail.com', 'ck.page',
	// Drip
	'drip.com', 'getdrip.com',
	// GetResponse
	'getresponse.com', 'gr-cdn.com',
	// Constant Contact
	'constantcontact.com', 'ctctcdn.com',
	// AWeber
	'aweber.com', 'aweberly.com',
	// Brevo (Sendinblue)
	'sendinblue.com', 'brevo.com',
	// Mailgun
	'mailgun.com', 'mailgun.org',
	// Postmark
	'postmarkapp.com',
	// SparkPost / MessageBird
	'sparkpost.com', 'messagebird.com',
	// Amazon SES tracking
	'amazonses.com',
	// Yesware
	'yesware.com',
	// Mixpanel email
	'mixpanel.com',
	// Intercom
	'intercom.io', 'intercom-mail.com',
	// Drip / Customer.io
	'customer.io', 'customeriomail.com',
	// MoEngage
	'moengage.com',
	// Iterable
	'iterable.com',
	// Generic open tracking paths
	'open.php', 'track.php', 'pixel.php', 'beacon.php',
	// Generic tracking sub-paths
	'/track/', '/pixel/', '/open/', '/beacon/', '/t.gif', '/trk',
];

/** Transparent 1×1 GIF data URI — replaces tracker pixel src values */
const BLANK_PIXEL =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Returns true if the given URL matches a known tracker domain / path pattern.
 * @param {string} src
 * @returns {boolean}
 */
function isKnownTracker(src) {
	if (!src || src.startsWith('data:') || src.startsWith('cid:') || src.startsWith('{{domain}}')) {
		return false;
	}
	const lower = src.toLowerCase();
	return TRACKER_DOMAINS.some(pattern => lower.includes(pattern));
}

/**
 * Returns true if the img element looks like a 1×1 tracking pixel.
 * Checks width/height attributes, inline style, and CSS display:none.
 * @param {Element} img
 * @returns {boolean}
 */
function isPixelImage(img) {
	const w = img.getAttribute('width');
	const h = img.getAttribute('height');
	if (w === '1' && h === '1') return true;
	if (w === '0' || h === '0') return true;

	const style = img.getAttribute('style') || '';
	if (/display\s*:\s*none/i.test(style)) return true;
	if (/width\s*:\s*0/i.test(style) || /height\s*:\s*0/i.test(style)) return true;
	if (/width\s*:\s*1px/i.test(style) && /height\s*:\s*1px/i.test(style)) return true;
	if (/visibility\s*:\s*hidden/i.test(style)) return true;
	if (/opacity\s*:\s*0/i.test(style)) return true;

	return false;
}

/**
 * Returns true if the src looks like an external URL (not inline / CID / relative).
 * @param {string} src
 * @returns {boolean}
 */
function isExternal(src) {
	if (!src) return false;
	const lower = src.toLowerCase().trim();
	return (lower.startsWith('http://') || lower.startsWith('https://')) &&
		!lower.startsWith('data:') &&
		!lower.startsWith('cid:') &&
		!lower.includes('{{domain}}');
}

/**
 * Sanitize HTML email body — strip tracking pixels and neutralize known tracker images.
 * Runs server-side before the email is stored in the database.
 *
 * @param {string|null} html - Raw HTML email body
 * @returns {{ html: string, trackerCount: number, trackerDomains: string[] }}
 */
function sanitize(html) {
	if (!html) {
		return { html: '', trackerCount: 0, trackerDomains: [] };
	}

	const { document } = parseHTML(html);
	let trackerCount = 0;
	const detectedDomains = new Set();

	// ── 1. Process all <img> elements ─────────────────────────────────────────
	const images = Array.from(document.querySelectorAll('img'));

	for (const img of images) {
		const src = img.getAttribute('src') || '';

		// Skip already-processed / inline images
		if (!src || src.startsWith('data:') || src.startsWith('cid:') || src.startsWith('{{domain}}')) {
			continue;
		}

		const pixel = isPixelImage(img);
		const knownTracker = isKnownTracker(src);

		if (pixel || knownTracker) {
			// Replace the src so the tracker server never receives a request
			img.setAttribute('data-tracker-src', src);
			img.setAttribute('src', BLANK_PIXEL);
			img.setAttribute('data-tracker', 'true');
			trackerCount++;

			try {
				const url = new URL(src);
				detectedDomains.add(url.hostname.replace(/^www\./, ''));
			} catch {
				detectedDomains.add('unknown');
			}
		}
	}

	// ── 2. Remove hidden/preload <link> tags used for tracking ────────────────
	const links = Array.from(document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]'));
	for (const link of links) {
		const href = link.getAttribute('href') || '';
		if (isExternal(href) && isKnownTracker(href)) {
			link.remove();
			trackerCount++;
		}
	}

	// ── 3. Neutralize tracking background-images in inline styles ─────────────
	const allElements = Array.from(document.querySelectorAll('[style]'));
	for (const el of allElements) {
		const style = el.getAttribute('style') || '';
		// Find url(...) patterns
		const urlMatch = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)/i);
		if (urlMatch && isKnownTracker(urlMatch[1])) {
			const cleaned = style.replace(
				/background(?:-image)?\s*:[^;]*url\(\s*['"]?https?:\/\/[^'")\s]+['"]?\s*\)[^;]*/gi,
				'background-image:none'
			);
			el.setAttribute('style', cleaned);
			el.setAttribute('data-tracker-bg', 'true');
			trackerCount++;
		}
	}

	return {
		html: document.toString(),
		trackerCount,
		trackerDomains: Array.from(detectedDomains),
	};
}

export default { sanitize, isKnownTracker, isExternal, isPixelImage, BLANK_PIXEL };
