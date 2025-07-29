import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compress } from 'vite-plugin-compress';

// Production-optimized Vite configuration
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/rust-terminal-forge/',
  
  // Production build optimizations
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    sourcemap: mode === 'development',
    
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Efficient code splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          terminal: [
            './src/components/RealTerminal.tsx',
            './src/components/EnhancedRealTerminal.tsx',
            './src/components/MultiTabTerminal.tsx'
          ],
          ai: [
            './src/core/ai/AIProviderRegistry.ts',
            './src/core/ai/providers/ClaudeProvider.ts',
            './src/core/ai/providers/GeminiProvider.ts'
          ]
        },
        // Optimize chunk names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Terser optimization settings
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    }
  },
  
  // CSS optimization
  css: {
    devSourcemap: mode === 'development',
    postcss: {
      plugins: [
        require('cssnano')({
          preset: ['advanced', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            mergeLonghand: true,
            mergeRules: true,
            autoprefixer: { add: true }
          }]
        })
      ]
    }
  },
  
  // Development server configuration
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: true
    },
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
    
    // Bundle analysis
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    
    // Compression
    compress({
      brotli: true,
      gzip: true
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Testing configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
}));