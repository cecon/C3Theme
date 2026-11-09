import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/dist-electron/**', '**/node_modules/**', '**/*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: true }],
      // deep imports from MUI break across majors: always use the public entry points
      'no-restricted-imports': ['error', { patterns: ['@mui/*/*/*'] }]
    }
  },
  {
    // scripts e a suíte de conformidade rodam no Node
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node }
  },
  prettierRecommended,
  { rules: { 'prettier/prettier': 'warn' } }
);
