import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/rust-terminal-forge/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/auth': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/health': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/sessions': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/socket.io': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
