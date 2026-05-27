export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  modules: ['@nuxtjs/sitemap'],

  site: {
    url: 'https://example.com',
  },

  sitemap: {
    // Single static sitemap.xml prerendered at build time. Mirrors how
    // production sites with prerendered Vercel image URLs are configured.
    sitemaps: false,
    zeroRuntime: true,
    // `discoverImages: true` (the default) is what triggers the bug.
    // Setting it to `false` is the only user-side workaround.
  },
})
