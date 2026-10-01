import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'drizzle/**', 'scripts/*.mjs', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-plugin-react's 'detect' calls context.getFilename(), which ESLint 10 removed.
    settings: { react: { version: '19.3' } },
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error'
    }
  },
  {
    files: ['scripts/db/**/*.ts', 'tests/**/*.ts', 'e2e/**/*.ts'],
    rules: { 'no-console': 'off' }
  }
];

export default config;
