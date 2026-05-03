import app from '../hono/hono';

/**
 * Digital Asset Links — required for Trusted Web Activity (Android TWA / Play Store).
 * After generating your APK with PWABuilder, replace the sha256_cert_fingerprints value
 * with the one from your signing-key-info.txt file.
 *
 * File is served at: https://yourdomain.com/.well-known/assetlinks.json
 */
app.get('/.well-known/assetlinks.json', (c) => {
	const links = [
		{
			relation: ['delegate_permission/common.handle_all_urls'],
			target: {
				namespace: 'android_app',
				package_name: 'com.wambugumail.twa',   // ← must match your TWA package name in PWABuilder
				sha256_cert_fingerprints: [
					'REPLACE_WITH_YOUR_SHA256_FINGERPRINT'  // ← paste fingerprint from PWABuilder signing-key-info.txt
				]
			}
		}
	];

	return c.json(links, 200, {
		'Content-Type': 'application/json',
		'Cache-Control': 'public, max-age=3600',
	});
});
