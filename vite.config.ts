import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // '' prefix so non-VITE_ vars (like VITE_API_PROXY_TARGET) are visible here.
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Proxying keeps the browser on one origin locally, exactly like the
      // Cloudflare Pages Function does in production (/api/* -> FastAPI).
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
