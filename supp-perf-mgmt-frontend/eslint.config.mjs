import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. React
            ['^react(-dom)?(/.*)?$'],
            // 2. Next.js
            ['^next(/.*)?$'],
            // 3. Third-party packages (MUI, Tanstack, Zod, Recharts, etc.)
            ['^@?\\w'],
            // 4. Internal aliases (@/lib, @/services, @/hooks, @/types, @/components, @/app)
            ['^@/'],
            // 5. Relative imports
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
