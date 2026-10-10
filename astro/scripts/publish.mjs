// Chep trang blog Astro vua build (dist/blog) sang thu muc blog/ cua web,
// va bo sung vao sitemap.xml cac bai moi chua co.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist/blog');
const BLOG = path.resolve('../blog');
const SITEMAP = path.resolve('../sitemap.xml');
const SITEMAP_HOST = 'https://tuongotsieucay.web.app';

const pages = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
for (const f of pages) fs.copyFileSync(path.join(DIST, f), path.join(BLOG, f));
console.log(`Da chep ${pages.length} trang vao blog/`);

// Trang .html trong blog/ khong do Astro sinh ra (tru cong cu admin) = bai mo coi, can xoa tay
const orphans = fs.readdirSync(BLOG).filter((f) => f.endsWith('.html') && f !== 'admin.html' && !pages.includes(f));
if (orphans.length) console.warn(`CANH BAO: blog/ con trang khong co nguon Astro: ${orphans.join(', ')}`);

let xml = fs.readFileSync(SITEMAP, 'utf8');
const eol = xml.includes('\r\n') ? '\r\n' : '\n';
const today = new Date().toISOString().slice(0, 10);
const added = [];
for (const f of pages.filter((f) => f !== 'index.html')) {
  const loc = `${SITEMAP_HOST}/blog/${f}`;
  if (xml.includes(`<loc>${loc}</loc>`)) continue;
  const entry = ['  <url>', `    <loc>${loc}</loc>`, `    <lastmod>${today}</lastmod>`,
    '    <changefreq>monthly</changefreq>', '    <priority>0.7</priority>', '  </url>'].join(eol);
  xml = xml.replace('</urlset>', `${entry}${eol}</urlset>`);
  added.push(f);
}
if (added.length) {
  fs.writeFileSync(SITEMAP, xml);
  console.log(`Sitemap: them ${added.length} bai: ${added.join(', ')}`);
} else console.log('Sitemap: da du bai.');
