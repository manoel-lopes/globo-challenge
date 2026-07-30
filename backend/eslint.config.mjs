import node from 'eslightning/node'

export default [
  {
    ignores: ['**/*', '!src/**', '!tests/**', '**/*.e2e-spec.ts'],
  },
  ...node,
  {
    rules: {
      'lines-between-class-members': 'off',
    },
  },
]
