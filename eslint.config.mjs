import eslint from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'
import tseslint from 'typescript-eslint'

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.{js,mjs,cjs,ts}'],
  plugins: {
    perfectionist,
  },
  rules: {
    'perfectionist/sort-array-includes': 'error',
    'perfectionist/sort-exports': 'error',
    'perfectionist/sort-imports': 'error',
    'perfectionist/sort-interfaces': 'error',
    'perfectionist/sort-intersection-types': 'error',
    'perfectionist/sort-jsx-props': 'error',
    'perfectionist/sort-named-exports': 'error',
    'perfectionist/sort-union-types': 'error',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-return': 'error',
    'no-useless-catch': 'error',
    'no-useless-constructor': 'error',
    'no-empty-function': 'warn',
    'no-empty': 'error',

    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-func-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-obj-calls': 'error',
    'no-sparse-arrays': 'error',
    'no-unexpected-multiline': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',

    'prefer-template': 'error',
    'prefer-spread': 'error',
    'prefer-rest-params': 'error',
    'prefer-destructuring': [
      'error',
      {
        array: true,
        object: true,
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'object-shorthand': 'error',
    'no-useless-concat': 'error',
    'template-curly-spacing': 'error',

    'func-style': ['error', 'expression'],
    'arrow-parens': ['error', 'as-needed'],
    'no-confusing-arrow': 'error',
  },
  settings: {
    perfectionist: {
      type: 'natural',
    },
  },
})
