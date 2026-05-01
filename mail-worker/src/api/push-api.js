import app from '../hono/hono';
import pushService from '../service/push-service';
import result from '../model/result';
import userContext from '../security/user-context';

// Save a push subscription for the logged-in user
app.post('/push/subscribe', async (c) => {
	const userId = userContext.getUserId(c);
	const subscription = await c.req.json();
	await pushService.subscribe(c, userId, subscription);
	return c.json(result.ok());
});

// Remove push subscription (pass { endpoint } in body, or omit to remove all)
app.delete('/push/unsubscribe', async (c) => {
	const userId = userContext.getUserId(c);
	let endpoint = null;
	try {
		const body = await c.req.json();
		endpoint = body?.endpoint || null;
	} catch (_) { /* body is optional */ }
	await pushService.unsubscribe(c, userId, endpoint);
	return c.json(result.ok());
});
