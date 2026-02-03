import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCH53wV_AUnSB_XZBXTA6iGDr4oil_deUAtu6YP8_SEibQ9-0SGB_wyjyGsXQsupOBdnnFW3q9GW93xZwJL_Crg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'LDEdTUm9vZwT1GsWjrbl3OMVIDxujOCqB9zFilc9UgI';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:info@auri-crm.com';

webpush.setVapidDetails(
    VAPID_EMAIL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export class WebPushService {
    static async sendNotification(subscription: any, payload: { title: string, body: string, icon?: string, data?: any }) {
        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    notification: {
                        title: payload.title,
                        body: payload.body,
                        icon: payload.icon || '/aurie-official-logo.png',
                        badge: '/icons/icon-192x192.png',
                        data: payload.data || {}
                    }
                })
            );
            return { success: true };
        } catch (error: any) {
            console.error('WebPushService Error:', error);
            // If subscription is expired or no longer valid
            if (error.statusCode === 404 || error.statusCode === 410) {
                return { success: false, error: 'GONE', statusCode: error.statusCode };
            }
            return { success: false, error: error.message };
        }
    }

    static getPublicKey() {
        return VAPID_PUBLIC_KEY;
    }
}
