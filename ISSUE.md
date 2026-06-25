# fix: discoverImages double-encodes already entity-encoded image:loc URLs

## 🐛 The bug

With `discoverImages` enabled (the default), `@nuxtjs/sitemap` reads `<img src>` values straight out of the prerendered HTML and re-runs them through `xmlEscape` before writing `sitemap.xml`. Vue serialises query-string ampersands in the attribute as HTML entities (`&amp;`), so the value the parser hands back already contains a literal `&amp;`. Escaping that again turns every `&` into `&amp;`, producing `&amp;amp;` in the emitted `<image:loc>`.

Rendered HTML on the prerendered page (one layer of encoding, correct):

```html
<img src="/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80" width="768" height="768" alt="portrait">
```

Resulting `sitemap.xml` (two layers of encoding, wrong):

```xml
<image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;amp;w=768&amp;amp;q=80</image:loc>
```

A consumer that decodes the sitemap once gets `...webp&amp;w=768&amp;q=80`, so the literal `&amp;` lands in the request and an image optimizer such as Vercel reads it as a malformed query segment and returns a 400. The image entries are effectively unfetchable for crawlers.

## 🛠️ To reproduce

https://stackblitz.com/github/JonathanXDR/repro-nuxtjs-sitemap-discover-images-double-encode

## 🌈 Expected behavior

The discovered image URL is encoded exactly once, matching what the page actually links to:

```xml
<image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80</image:loc>
```

## ℹ️ Additional context

Root cause is that the extracted attribute value is not entity-decoded before it is re-escaped on the way out.

1. Extraction. `parseHtmlExtractSitemapMeta` in `dist/shared/sitemap.DJC-maKi.mjs` (img branch around line 102) takes `attrs.src` through `sanitizeString` (line 23), which only trims and strips control characters. It does not decode HTML entities, so the literal `&amp;` produced by the HTML serializer survives into the images set.

2. Serialisation. `dist/runtime/server/sitemap/builder/xml.js` line 33 writes the image loc as `<image:loc>${xmlEscape(img.loc)}</image:loc>`.

3. Escape. `xmlEscape` in `dist/runtime/server/utils.js` replaces `&` with `&amp;`, so the surviving `&amp;` becomes `&amp;amp;`.

Decoding `attrs.src` (or otherwise treating it as already-encoded) before adding it to the images set would fix the double encoding without weakening the XML escape applied to other fields.

User-side workaround: `sitemap: { discoverImages: false }`. Crawlers still pick the `<img>` tags off the rendered pages directly, so the practical cost is small, but the fix is preferable because `discoverImages` is the path that associates page images in the sitemap itself.

Environment:

- `@nuxtjs/sitemap@8.2.1`
- `nuxt@4.4.6`
- `typescript@6.0.3`
- Node.js >= 20.19
