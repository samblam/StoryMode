import { defineConfig } from 'astro/config';
import UnoCSS from '@unocss/astro';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  integrations: [
    UnoCSS({
      presets: [
        require('@unocss/preset-uno')({
          theme: {
            colors: {
              brutal: {
                pink: '#ff0080',
                bg: '#ffe6f7',
                text: '#1a1a1a',
              }
            },
            fontFamily: {
              'outfit': ['Outfit', 'sans-serif'],
              'dm-serif': ['DM Serif Text', 'serif'],
              'poppins': ['Poppins', 'sans-serif'],
              'sanchez': ['Sanchez', 'serif'],
              'righteous': ['Righteous', 'cursive'],
            }
          }
        })
      ]
    })
  ],
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
      sourcemap: true,
      // Add rollup options to handle null bytes in paths
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignore warnings about null bytes in paths
          if (warning.code === 'INVALID_CHAR_IN_PATH') return;
          warn(warning);
        }
      }
    },
    server: {
      headers: {
        maxHeaderSize: 8192
      }
    },
    // Use a simpler TypeScript configuration
    optimizeDeps: {
      esbuildOptions: {
        tsconfigRaw: {
          compilerOptions: {
            target: "esnext",
            module: "esnext",
            moduleResolution: "node",
            allowSyntheticDefaultImports: true,
            jsx: "preserve",
            jsxImportSource: "astro",
            skipLibCheck: true
          }
        }
      }
    },
    // Provide a direct path to tsconfig.json
    resolve: {
      alias: {
        '~': '/src',
        'chart.js': 'node_modules/chart.js/dist/chart.js'
      }
    }
  }
});