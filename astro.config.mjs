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
    externals: [],
    includeFiles: ['**/*'],
    bundleNodeModules: true,
    minify: true,
    isr: {
      enabled: true,
      maxDuration: 10
    }
  }),
  vite: {
    build: {
      target: 'esnext',
      modulePreload: {
        polyfill: false
      },
      rollupOptions: {
        output: {
          format: 'esm',
          inlineDynamicImports: true,
          preserveModules: false,
          manualChunks: undefined
        }
      },
      sourcemap: true
    },
    ssr: {
      noExternal: true
    }
  }
});