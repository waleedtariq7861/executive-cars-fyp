import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_DEV_SERVER_TARGET || 'http://127.0.0.1:5000'

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
    },
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/socket.io': { target: backendTarget, changeOrigin: true, ws: true },
        // Vehicle images stored by the local-disk upload mode are addressed by a path on this site.
        '/uploads': { target: backendTarget, changeOrigin: true },
      },
    },
  }
})
