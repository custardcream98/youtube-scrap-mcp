import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',

    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],

    globals: true,

    testTimeout: 30000,

    hookTimeout: 10000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/[.]**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        '**/virtual:*',
        '**/__x00__*',
        '**/\x00*',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/vitest.config.*',
        '**/vite.config.*',
      ],
    },

    reporters: ['verbose'],

    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
