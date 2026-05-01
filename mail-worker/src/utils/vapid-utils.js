/**
 * VAPID signing for Web Push — uses only crypto.subtle, works on Cloudflare Workers.
 * Reference: https://datatracker.ietf.org/doc/html/rfc8292
 */

const b64u = (buf) => {
	let str = '';
	const bytes = new Uint8Array(buf);
	for (const b of bytes) str += String.fromCharCode(b);
	return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const b64uDecode = (str) => {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

/**
 * Import a raw VAPID private key (base64url-encoded) for P-256 ECDH signing.
 */
async function importPrivateKey(b64uKey) {
	const raw = b64uDecode(b64uKey);
	return crypto.subtle.importKey(
		'pkcs8',
		raw,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	).catch(async () => {
		// Some keys are provided as raw 32-byte scalars — wrap in PKCS8 manually
		const pkcs8 = buildPkcs8(raw);
		return crypto.subtle.importKey(
			'pkcs8',
			pkcs8,
			{ name: 'ECDSA', namedCurve: 'P-256' },
			false,
			['sign']
		);
	});
}

// Build a minimal PKCS8 wrapper around a raw P-256 private key scalar
function buildPkcs8(rawKey) {
	// ASN.1 PKCS8 structure for P-256
	const header = new Uint8Array([
		0x30, 0x41, // SEQUENCE
		0x02, 0x01, 0x00, // version = 0
		0x30, 0x13, // SEQUENCE (AlgorithmIdentifier)
		0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID id-ecPublicKey
		0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID P-256
		0x04, 0x27, // OCTET STRING
		0x30, 0x25, // SEQUENCE (ECPrivateKey)
		0x02, 0x01, 0x01, // version = 1
		0x04, 0x20  // OCTET STRING (privateKey = 32 bytes)
	]);
	const result = new Uint8Array(header.length + rawKey.length);
	result.set(header);
	result.set(rawKey, header.length);
	return result.buffer;
}

/**
 * Build and sign a VAPID JWT.
 * @param {string} audience  - e.g. "https://fcm.googleapis.com"
 * @param {string} subject   - mailto: or https: contact
 * @param {CryptoKey} privateKey
 */
async function signVapidJwt(audience, subject, privateKey) {
	const enc = new TextEncoder();
	const header = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
	const now = Math.floor(Date.now() / 1000);
	const payload = b64u(enc.encode(JSON.stringify({
		aud: audience,
		exp: now + 12 * 3600,
		sub: subject
	})));
	const data = `${header}.${payload}`;
	const sig = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		privateKey,
		enc.encode(data)
	);
	return `${data}.${b64u(sig)}`;
}

export { importPrivateKey, signVapidJwt };
