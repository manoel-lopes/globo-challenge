export default {
  '{src,tests}/**/*.ts': ['eslint --fix', () => 'pnpm check-types'],
}
