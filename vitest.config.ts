import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        pool: '@cloudflare/vitest-pool-workers',
        poolOptions: {
            workers: {
                wrangler: { configPath: './wrangler.toml' },
            },
        },
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
            ],
        },
    },
});
