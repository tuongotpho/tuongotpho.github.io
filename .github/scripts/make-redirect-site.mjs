// Tao ban "bien chi duong" cho cac ban sao tren GitHub Pages.
// Moi trang cu (index, app, gallery, blog/...) thanh mot trang nho chuyen thang
// ve cung duong dan tren dia chi chinh tuongotsieucay.web.app, giu nguyen ?query va #hash.
// Google coi meta refresh 0 giay + canonical la chuyen huong vinh vien.
//
// Cach chay: node .github/scripts/make-redirect-site.mjs <thu-muc-dau-ra>
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MAIN = 'https://tuongotsieucay.web.app';
const out = process.argv[2];
if (!out) throw new Error('Thieu thu muc dau ra');

const pages = execSync('git ls-files "*.html"', { encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && !f.startsWith('astro/') && !/^google[0-9a-f]+\.html$/.test(f));

const stub = (target) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Đã chuyển sang ${MAIN.replace('https://', '')}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
</head>
<body>
<p>Cửa hàng Tương Ớt Bông Ớt đã chuyển sang địa chỉ mới: <a href="${target}">${target}</a></p>
</body>
</html>
`;

const write = (file, html) => {
  const p = join(out, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
};

for (const f of pages) {
  // index.html -> "/", blog/index.html -> "/blog/"
  const path = '/' + f.replace(/(^|\/)index\.html$/, '$1');
  write(f, stub(MAIN + path));
}

// Duong dan cu khong con trang tuong ung: chuyen ve cung duong dan tren web chinh.
write('404.html', `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Đã chuyển sang ${MAIN.replace('https://', '')}</title>
<script>location.replace(${JSON.stringify(MAIN)} + location.pathname + location.search + location.hash);</script>
</head>
<body><p>Đã chuyển sang <a href="${MAIN}/">${MAIN}</a></p></body>
</html>
`);

writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${MAIN}/sitemap.xml\n`);

console.log(`Da tao ${pages.length} trang chuyen huong + 404.html vao ${out}`);
