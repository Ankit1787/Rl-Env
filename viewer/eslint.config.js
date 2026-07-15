import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.nuxt/**', '.output/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
);
