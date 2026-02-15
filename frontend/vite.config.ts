import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'unsafe-none',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        },
    },
})
