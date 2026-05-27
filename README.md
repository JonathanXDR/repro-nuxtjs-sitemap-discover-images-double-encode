# Repro: `@nuxtjs/sitemap@8.0.15` `discoverImages` double-encodes already-entity-encoded image URLs

Minimal Nuxt 4 project showing that `discoverImages: true` (the default)
re-runs already-HTML-entity-encoded `<img src>` values through
`xmlEscape()`, producing `&amp;amp;` in `sitemap.xml`. Vercel reads
`&amp;w=…` as a literal query-string segment and rejects the URL, so
the discovered image entries are unfetchable for crawlers.

## Steps to reproduce

```bash
npm install
npm run generate
npm run inspect:sitemap
```

1. `nuxi generate` prerenders the home page. The `<img src>` value Vue
   serialises into the prerendered HTML is HTML-entity-encoded:

   ```html
   <img src="/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80">
   ```

2. `@nuxtjs/sitemap` reads that HTML, extracts `attrs.src` *without
   decoding entities*, and then xml-escapes the value before writing
   `sitemap.xml`. The resulting `<image:loc>` is double-encoded:

   ```xml
   <image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;amp;w=768&amp;amp;q=80</image:loc>
   ```

3. The `inspect:sitemap` script prints every `<image:loc>` entry so the
   double encoding is visible without opening the file.

## Expected behaviour

The discovered image URL is encoded exactly once:

```xml
<image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80</image:loc>
```

## Actual behaviour

Two layers of entity encoding (`&amp;amp;`) — search engines fetch the
literal `&amp;` and Vercel's image optimizer returns a 400.

## Root cause

Attribute extraction (`node_modules/@nuxtjs/sitemap/dist/shared/sitemap.DJC-maKi.mjs`):

```js
function parseHtmlExtractSitemapMeta(html, options) {
  // …
  const images = new Set()
  // …
  if (options?.images && element.name === 'img') {
    const src = sanitizeString(attrs.src)
    if (src && isValidUrl(src)) {
      const resolvedUrl = resolveUrl(src)
      images.add(resolvedUrl)
    }
  }
  // …
}
```

The HTML parser used here is `ultrahtml`, whose attribute parser
(`node_modules/ultrahtml/dist/index.mjs`) reads attribute values
*verbatim* — entities such as `&amp;` are not decoded. So
`attrs.src === '…&amp;w=…'` (literal `&amp;`) is added to the set.

Serialisation
(`node_modules/@nuxtjs/sitemap/dist/runtime/server/sitemap/builder/xml.js:33`):

```js
xml += `${I2}<image:image>${NL}${I3}<image:loc>${xmlEscape(img.loc)}</image:loc>${NL}`
```

`xmlEscape` (`node_modules/@nuxtjs/sitemap/dist/runtime/server/utils.js`):

```js
export function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')   // ← turns the literal `&amp;` into `&amp;amp;`
    .replace(/</g, '&lt;')
    // …
}
```

Decoding `attrs.src` before adding it to `images` (or detecting that the
value is already entity-encoded) would fix the double encoding without
relaxing the XML escape on the way out.

## User-side workaround

```ts
sitemap: { discoverImages: false }
```

Crawlers still pick up the rendered `<img>` tags directly, so the
practical cost is small for image search. The fix is preferable because
`discoverImages` is the only path that surfaces page-image associations
to other sitemap consumers.

## Related upstream activity

- PR [`nuxt-modules/sitemap#610`](https://github.com/nuxt-modules/sitemap/pull/610) —
  *"fix: escape all user-provided XML fields"* (merged 2026-04-25). Adjacent
  area but the opposite direction: it added missing escapes for
  `<lastmod>`, `<changefreq>`, and several `<video:*>` fields. The
  discoverImages double encoding is *over*-escaping rather than
  *under*-escaping, so #610 doesn't address it.
- Issue [`#238`](https://github.com/nuxt-modules/sitemap/issues/238) —
  *"Disabling image autodiscovery"* — the workaround above is the
  long-standing answer.

No existing issue or PR addresses the entity-decoding step at the time
of writing.

## Environment

- `nuxt@4.4.6`
- `@nuxtjs/sitemap@8.0.15`
- `typescript@6.0.3`
- Node.js ≥ 20.19
