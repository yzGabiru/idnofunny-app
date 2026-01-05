import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['react-filerobot-image-editor'], // Ensure it's excluded if it persists in cache
    include: ['fabric'] // Force optimization of fabric
  }
})