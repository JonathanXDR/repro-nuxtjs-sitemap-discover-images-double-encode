<script setup lang="ts">
// Bound at runtime so Rollup's static analyzer leaves it alone. Vue's
// template renderer will HTML-encode the `&` characters when serialising
// the attribute to HTML, producing `&amp;w=768&amp;q=80` in the
// prerendered file. That is the input @nuxtjs/sitemap's discoverImages
// later parses with ultrahtml (which does not decode entities), then
// re-escapes via xmlEscape, producing the doubled `&amp;amp;`.
const imageSrc
  = '/_vercel/image?url=%2Fimg%2Fportrait.webp&w=768&q=80'
</script>

<template>
  <main>
    <h1>repro: @nuxtjs/sitemap discoverImages double-encodes</h1>
    <p>
      Inspect the rendered HTML below for <code>src="...&amp;w=768&amp;q=80"</code>
      (one layer of HTML entity encoding). Then run
      <code>npm run inspect:sitemap</code>: the corresponding
      <code>&lt;image:loc&gt;</code> contains <code>&amp;amp;w=768</code> (two
      layers), and crawlers cannot fetch that URL.
    </p>
    <img
      :src="imageSrc"
      width="768"
      height="768"
      alt="portrait"
    >
  </main>
</template>
