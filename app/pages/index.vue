<template>
  <main>
    <h1>repro: @nuxtjs/sitemap discoverImages double-encodes</h1>
    <p>
      The image URL below mirrors what <code>@nuxt/image</code>'s vercel
      provider emits in prerendered production HTML
      (<code>/_vercel/image?url=…&amp;w=…&amp;q=…</code>). Vue HTML-encodes
      the <code>&amp;</code> in <code>src</code> on render, so the
      prerendered file contains <code>&amp;amp;w=…</code>. The bug is what
      the sitemap module does with that <code>src</code> next.
    </p>
    <!--
      Hand-written so the repro doesn't depend on @nuxt/image. The literal
      `&` in the source becomes `&amp;` in the rendered HTML, which is what
      ultrahtml's attribute parser then reads back from the prerendered
      file — without decoding entities.
    -->
    <img
      src="/_vercel/image?url=%2Fimg%2Fportrait.webp&w=768&q=80"
      width="768"
      height="768"
      alt="portrait"
    >
  </main>
</template>
