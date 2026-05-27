# Repro: `@nuxtjs/sitemap@8.0.15` `discoverImages` double-encodes Vercel image URLs

Minimal Nuxt 4 project showing that `discoverImages: true` (the default) HTML-entity-encodes already-encoded image URLs, producing sitemap entries that crawlers cannot fetch.

## What you should see

1. `npm run generate`
2. Open `.output/public/sitemap.xml`.
3. The discovered image URL contains `&amp;amp;`:

```xml
<image:image>
  <image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;amp;w=768&amp;amp;q=80</image:loc>
</image:image>
```

The expected output is a single layer of `&amp;`:

```xml
<image:loc>https://example.com/_vercel/image?url=%2Fimg%2Fportrait.webp&amp;w=768&amp;q=80</image:loc>
```

The double-encoded URL hits Vercel as a literal `&amp;w=768`, which the image optimizer rejects.

## Why it fails

`@nuxt/image`'s vercel provider emits `<img>` tags whose `src` is already HTML-entity-encoded in the prerendered HTML (`&amp;w=768&amp;q=80`). `@nuxtjs/sitemap@8.0.15` auto-extracts these `src` attributes and pipes them through `xmlEscape()` again before writing the sitemap, double-encoding them.

## Workaround

```ts
sitemap: { discoverImages: false }
```

Image search still picks up the portrait via the rendered `<img>` tags, so the cost of disabling discovery is small — but it loses every other auto-discovered image, which is the feature's reason for existing.

## Ask

HTML-decode discovered image-attribute values before XML-escaping (or detect that they're already entity-encoded and skip the second pass).

## Versions

- `nuxt@4.4.6`
- `@nuxt/image@2.0.0`
- `@nuxtjs/sitemap@8.0.15`
