import http from '@/axios/index.js';

export function pushSubscribe(subscription) {
    return http.post('/push/subscribe', subscription, { noMsg: true });
}

export function pushUnsubscribe(endpoint) {
    return http.delete('/push/unsubscribe', {
        data: endpoint ? { endpoint } : undefined,
        noMsg: true
    });
}
