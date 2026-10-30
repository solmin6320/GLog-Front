import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// 화면 코드가 네트워크 계층과 목을 직접 부르지 않게 막는다 (설계서 2장 의존 방향, S-2).
const screenRestrictions = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['@/mocks', '@/mocks/*'], message: '화면 코드는 목을 import하지 않는다. 데이터는 GraphQL 문서로만 가져온다.' },
        { group: ['@apollo/client/link', '@apollo/client/link/*'], message: '링크는 shared/api에서만 다룬다.' },
        { group: ['msw', 'msw/*'], message: 'MSW는 src/mocks · 테스트에서만 쓴다.' },
      ],
    },
  ],
  'no-restricted-globals': ['error', { name: 'fetch', message: 'REST는 shared/api/rest.ts만 호출한다.' }],
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'src/gql', 'src/mocks/__generated__', 'public/mockServiceWorker.js', 'docs'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/layouts/**/*.{ts,tsx}', 'src/guards/**/*.{ts,tsx}', 'src/session/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: screenRestrictions,
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['react', 'react-*', '@apollo/*', '@/shared/ui/*', '@/features/*'], message: 'domain은 순수 TS다 (앱 재사용).' }] },
      ],
    },
  },
  {
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/features/*'], message: '목은 화면 코드를 import하지 않는다.' }] }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'codegen.ts'],
    languageOptions: { globals: globals.node },
  },
);
