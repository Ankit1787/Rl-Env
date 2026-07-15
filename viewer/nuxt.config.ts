export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-07-13',
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    public: {
      environmentBaseUrl:
        process.env.NUXT_PUBLIC_ENVIRONMENT_BASE_URL ??
        process.env.ENVIRONMENT_BASE_URL ??
        'http://localhost:3001',
      trainerBaseUrl:
        process.env.NUXT_PUBLIC_TRAINER_BASE_URL ?? 'http://localhost:8000',
    },
  },
  typescript: {
    strict: true,
  },
});
