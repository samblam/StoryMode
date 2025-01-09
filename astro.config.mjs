import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          format: 'esm',
          chunkFileNames: 'chunks/[name].[hash].mjs',
          assetFileNames: 'assets/[name].[hash][extname]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    ssr: {
      noExternal: ['howler']
    }
  }
});