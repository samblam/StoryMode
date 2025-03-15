import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

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
  }
});