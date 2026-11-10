import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': 'error', 'no-undef': 'error' },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
