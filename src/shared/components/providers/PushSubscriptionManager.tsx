'use client'

import { useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}

export function PushSubscriptionManager() {
    useEffect(() => {
        const setupPush = async () => {
            if (typeof window === 'undefined') return
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
            if (!window.isSecureContext) return

            try {
                const prefResponse = await fetch('/api/settings/notification-preferences', { cache: 'no-store' })
                if (!prefResponse.ok) return
                const prefData = await prefResponse.json()
                if (!prefData?.preferences?.push_enabled) return

                let permission = Notification.permission
                if (permission === 'default') {
                    permission = await Notification.requestPermission()
                }
                if (permission !== 'granted') return

                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                if (!vapidPublicKey) {
                    console.warn('PushSubscriptionManager: NEXT_PUBLIC_VAPID_PUBLIC_KEY ausente')
                    return
                }

                let registration = await navigator.serviceWorker.getRegistration()
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/sw.js')
                }

                let subscription = await registration.pushManager.getSubscription()
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                    })
                }

                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription })
                })
            } catch (error) {
                console.error('PushSubscriptionManager error:', error)
            }
        }

        setupPush()

        const onPrefsUpdated = () => {
            setupPush()
        }

        window.addEventListener('push-preference-updated', onPrefsUpdated)
        return () => {
            window.removeEventListener('push-preference-updated', onPrefsUpdated)
        }
    }, [])

    return null
}
