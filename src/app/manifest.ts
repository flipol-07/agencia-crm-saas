import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aurie CRM',
        short_name: 'Aurie',
        description: 'The ultimate CRM for your agency',
        start_url: '/',
        orientation: 'portrait',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
