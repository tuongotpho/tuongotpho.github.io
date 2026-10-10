// Nghiem thu: so trang blog cu (git, ban truoc khi chuyen) voi trang Astro moi, tung khu vuc.
// Cach dung: node scripts/compare.mjs <thu-muc-cu> <thu-muc-moi>
import fs from 'node:fs';
import * as cheerio from 'cheerio';

const [OLD = '../blog', NEW = 'dist/blog'] = process.argv.slice(2);
const files = fs.readdirSync(OLD).filter((f) => f.endsWith('.html') && f !== 'admin.html');

// Chuan hoa: bo khoang trang thua, sap xep thuoc tinh, bo id tu sinh o tieu de, bo comment
function canon(n) {
  if (n.type === 'text') return n.data.replace(/\s+/g, ' ').trim();
  if (n.type === 'comment' || n.type === 'directive') return '';
  if (!n.name) return '';
  const attrs = Object.entries(n.attribs)
    .filter(([k]) => !(k === 'id' && /^h[1-6]$/.test(n.name)))
    .map(([k, v]) => [k, k === 'style' ? v.replace(/\s+/g, '').replace(/;$/, '') : v.replace(/\s+/g, ' ').trim()])
    .sort();
  if (n.name === 'script' && n.attribs.type === 'application/ld+json') {
    return `<ld>${JSON.stringify(JSON.parse(cheerio.load(n).text()))}</ld>`;
  }
  if (n.name === 'script' && !n.attribs.src) {
    return `<script>${cheerio.load(n).text().replace(/\s+/g, '')}</script>`;
  }
  return `<${n.name}${attrs.map(([k, v]) => ` ${k}="${v}"`).join('')}>${n.children.map(canon).join('')}</${n.name}>`;
}
const load = (p) => cheerio.load(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const regions = {
  head: ($) => $('head').children().map((i, e) => canon(e)).get().sort().join('\n'),
  header: ($) => canon($('header')[0]),
  blogHeader: ($) => canon($('section.blog-header')[0]),
  body: ($) => { const b = $('.article-body').clone(); b.find('.share-buttons,.article-cta').remove(); return b.length ? canon(b[0]) : ''; },
  orderBox: ($) => $('.share-buttons,.article-cta').map((i, e) => canon(e)).get().join(''),
  related: ($) => $('.related-articles').map((i, e) => canon(e)).get().join(''),
  listing: ($) => $('.blog-listing').map((i, e) => canon(e)).get().join(''),
  bottom: ($) => $('body > section').not('.blog-header,.blog-listing').map((i, e) => canon(e)).get().join(''),
  footer: ($) => canon($('footer')[0]),
  scripts: ($) => $('body > script').map((i, e) => canon(e)).get().join(''),
  // Toan bo chu tren trang (tru chan trang, khoi dat hang), bo qua khoang trang
  textOnly: ($) => { const b = $('body').clone(); b.find('footer,.share-buttons,.article-cta').remove(); return b.text().replace(/\s+/g, ''); },
};
const firstDiff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };

const summary = {};
let missing = 0;
for (const f of files) {
  if (!fs.existsSync(`${NEW}/${f}`)) { console.log(`THIEU TRANG: ${f}`); missing++; continue; }
  const o = load(`${OLD}/${f}`), n = load(`${NEW}/${f}`);
  for (const [name, fn] of Object.entries(regions)) {
    const a = fn(o), b = fn(n);
    if (a === b) continue;
    (summary[name] ??= []).push(f);
    if (process.env.VERBOSE) {
      const i = firstDiff(a, b);
      console.log(`--- ${f} [${name}] lech tai ky tu ${i}\n  cu : ...${a.slice(Math.max(0, i - 80), i + 120)}\n  moi: ...${b.slice(Math.max(0, i - 80), i + 120)}`);
    }
  }
}
const extra = fs.readdirSync(NEW).filter((f) => f.endsWith('.html') && f !== 'admin.html' && !files.includes(f));
console.log(`\nSo trang cu: ${files.length} | trang moi: ${fs.readdirSync(NEW).filter((f) => f.endsWith('.html')).length} | thieu: ${missing} | thua: ${extra.join(', ') || 0}`);
for (const name of Object.keys(regions)) console.log(`${name.padEnd(10)} ${summary[name] ? `LECH ${summary[name].length} trang: ${summary[name].join(' ')}` : 'khop 100%'}`);
