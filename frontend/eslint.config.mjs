// @ts-check

import eslint from '@eslint/js'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'
import tseslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...neostandard({
    ignores: [...resolveIgnoresFromGitignore(), '**/routeTree.gen.ts', '**/.cursor/**'],
  }),
  {
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        React: true,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.mjs', '*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      'simple-import-sort/imports': ['warn', {
        groups: [
          [
            '^react$', '^react-dom$',
            '^@?\\w',
            '^@/core/',
            '^@/pages/',
            '^@/components/',
            '^@/hooks/',
            '^@/providers/',
            '^@/util/',
            '^@/lib/',
            '^\\.',
            '^\\u0000',
          ],
        ],
      }],
      'simple-import-sort/exports': 'warn',
      'unused-imports/no-unused-imports': 'warn',
      'no-useless-constructor': 'off',
      'no-unused-vars': 'off',
      'no-var': 'error',
      'no-console': ['error', { allow: ['error'] }],
      '@stylistic/max-len': 'off',
      'react-hooks/immutability': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never',
      }],
      '@stylistic/jsx-newline': ['warn', { prevent: true }],
      '@stylistic/multiline-ternary': 'off',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-useless-constructor': 'warn',
      'react/jsx-handler-names': 'off',
      '@stylistic/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'never', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        { blankLine: 'never', prev: ['const', 'let', 'var'], next: 'return' },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
]
