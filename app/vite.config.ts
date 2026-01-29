import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000, // Augmenter la limite d'avertissement à 3MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les gros modules en chunks
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'animation': ['gsap'],
          'pdf': ['jspdf', 'html2canvas'],
        },
      },
    },
  },
});
