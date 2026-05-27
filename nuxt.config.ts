export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  modules: ['@nuxt/image', '@nuxtjs/sitemap'],

  site: {
    url: 'https://example.com',
  },

  // Force vercel preset so @nuxt/image emits `/_vercel/image?url=…&w=…&q=…`
  // URLs (which are already HTML-entity-encoded in the prerendered HTML).
  nitro: {
    preset: 'vercel',
  },

  sitemap: {
    sitemaps: false,
    zeroRuntime: true,
    // `discoverImages` is on by default. Turning it OFF avoids the bug.
    // Leaving it ON (this repro's default) produces the double-encoded URLs.
    // discoverImages: false, // ← workaround
  },
})
