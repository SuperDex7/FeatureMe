import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  esbuild: {
    // Production builds drop debug logging (it printed chat lists, messages, etc.
    // to users' browser consoles). console.warn / console.error are kept.
    pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
  },
}))
