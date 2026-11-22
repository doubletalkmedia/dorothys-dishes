// build.mjs — writes the finished pages that Cloudflare serves.
//
// Why this exists: every page's words live in content.json, and site.js fills
// them in inside the visitor's browser. Search engines and link-preview tools
// that do not run JavaScript would otherwise see empty pages. This script runs
// site.js once on Cloudflare's side after every commit and saves the filled-in
// pages into dist/. In the browser site.js still runs as before, so dates
// (past shows hiding, the home page button) stay live.
//
// You never need to run this yourself; Cloudflare runs `npm run build` after
// each commit. Edit content.json or the CMS exactly as before.
//
// If anything here fails, the build stops and Cloudflare keeps serving the
// previous version of the site.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const OUT = 'dist';

// What gets published. Everything else in the repo (notes, CMS settings,
// Python helpers, this script) stays out of the public site.
const COPY = ['site.js', 'styles.css', 'content.json', 'images', 'robots.txt', 'sitemap.xml'];
const extraFiles = readdirSync('.').filter((f) => f.endsWith('.ics'));
const pages = readdirSync('.').filter((f) => f.endsWith('.html'));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of [...COPY, ...extraFiles]) {
  if (existsSync(f)) cpSync(f, `${OUT}/${f}`, { recursive: true });
}

const content = JSON.parse(readFileSync('content.json', 'utf8')); // stops the build on a typo
const siteJs = readFileSync('site.js', 'utf8');

for (const page of pages) {
  const source = readFileSync(page, 'utf8');
  const quiet = new VirtualConsole(); // jsdom can't navigate or measure; ignore those notices
  const dom = new JSDOM(source, {
    url: `https://dorothysdishes.com/${page}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: quiet,
  });
  const { window } = dom;
  const before = new Set(window.document.querySelectorAll('script'));
  window.SITE = JSON.parse(JSON.stringify(content));
  window.eval(siteJs);

  // Drop anything site.js appended while rendering (e.g. the Bandsintown
  // widget script); the browser adds it again itself.
  for (const s of window.document.querySelectorAll('script')) if (!before.has(s)) s.remove();
  // The "needs JavaScript" notice is only true of the unbuilt pages.
  for (const n of window.document.querySelectorAll('noscript')) n.remove();
  // The bar's "at top" state is set by site.js in the browser; start neutral.
  window.document.querySelector('.topbar')?.classList.remove('at-top');

  writeFileSync(`${OUT}/${page}`, dom.serialize());
  const words = window.document.body.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  console.log(`built ${page} (${words} words)`);
  window.close();
}
console.log(`done: ${pages.length} pages in ${OUT}/`);
