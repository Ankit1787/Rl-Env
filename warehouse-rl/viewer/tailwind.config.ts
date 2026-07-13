import type { Config } from 'tailwindcss';

export default {
  content: ['./app.vue', './components/**/*.{vue,ts}', './pages/**/*.vue'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
