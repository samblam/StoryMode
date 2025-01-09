import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: true,
    // Remove includeFiles that was causing the error
    functionPerRoute: false,
    deploymentSuffix: String(Date.now()),
  }),
  vite: {
    build: {
      assetsInlineLimit: 0,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: 'esm',
          entryFileNames: '[name].mjs',
          chunkFileNames: 'chunks/[name].[hash].mjs',
          assetFileNames: 'assets/[name].[hash][extname]',
          inlineDynamicImports: false,
          manualChunks: undefined
        }
      }
    },
    ssr: {
      noExternal: true
    }
  }
});