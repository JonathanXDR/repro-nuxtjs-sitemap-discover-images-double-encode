<template>
  <div>
    <h1>repro: @nuxtjs/sitemap discoverImages double-encodes</h1>
    <!--
      NuxtImg under the vercel provider emits something like:
        <img src="/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80">
      The src is already HTML-entity-encoded. discoverImages re-runs it
      through xmlEscape, producing &amp;amp;w=768 in sitemap.xml.
    -->
    <NuxtImg
      src="/img/portrait.webp"
      width="768"
      height="768"
      quality="80"
      alt="portrait"
    />
  </div>
</template>
