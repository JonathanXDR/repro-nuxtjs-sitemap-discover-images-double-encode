import { readFileSync, existsSync } from 'node:fs'

// WebContainer's jsh shell mangles the inline `node -e` regex (the <image:loc>
// angle brackets and escaped slashes), so the inspection lives in a file here.
const sitemap = '.output/public/sitemap.xml'
const page = '.output/public/index.html'
if (!existsSync(sitemap)) {
  console.error("Run 'npm run generate' first.")
  process.exit(1)
}

const imgInPage = (readFileSync(page, 'utf8').match(/<img[^>]*src="[^"]*"/g) || [])[0] || '(no <img> found)'
const locs = readFileSync(sitemap, 'utf8').match(/<image:loc>[^<]+<\/image:loc>/g) || []

console.log('----- <img src> as rendered in the page -----')
console.log(imgInPage)
console.log('')
console.log('----- <image:loc> in sitemap.xml -----')
console.log(locs.length ? locs.join('\n') : '(no image:loc entries found)')
console.log('')
console.log('Bug: the page encodes the URL once (&amp;w=768&amp;q=80), but the sitemap')
console.log('double-encodes it to &amp;amp;w=768&amp;amp;q=80 (an extra entity layer).')
