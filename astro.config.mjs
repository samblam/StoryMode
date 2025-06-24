import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: vercel({
    analytics: true,
    imageService: true,
    webAnalytics: {
      enabled: true
    },
    functionPerRoute: true,
    edgeMiddleware: true
  }),
  server: {
    port: 4322
  },
  vite: {
    logLevel: 'info',
    build: {
      sourcemap: true
    },
    server: {
      headers: {
        maxHeaderSize: 8192
      }
    }
  },
  resolve: {
    alias: {
      'chart.js': 'node_modules/chart.js/dist/chart.js'
    }
  }
});