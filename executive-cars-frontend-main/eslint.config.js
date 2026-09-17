import jsxA11y from 'eslint-plugin-jsx-a11y-x'

const recommended = jsxA11y.configs.recommended

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    ...recommended,
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ...recommended.languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ...recommended.languageOptions?.parserOptions,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...recommended.rules,
      'jsx-a11y-x/aria-role': ['error', { ignoreNonDOM: true }],
    },
  },
]
