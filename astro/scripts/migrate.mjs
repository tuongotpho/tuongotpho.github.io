// Chuyen 14 bai blog HTML cu sang file Markdown (frontmatter + than bai HTML giu nguyen).
// Chay MOT LAN khi chuyen doi. Sau do sua bai trong src/content/blog/*.md.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const OLD = path.resolve('../blog');
const OUT = path.resolve('src/content/blog');
const SITE = 'https://tuongotcay.github.io';
fs.mkdirSync(OUT, { recursive: true });

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const dedent = (html) => html.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('\n');
const squash = (s) => s.replace(/\s+/g, '');
const DEFAULT_CTA = squash(fs.readFileSync('src/components/BottomCta.astro', 'utf8').split('---').pop());
const isoDate = (vn) => { const [d, m, y] = vn.split('/'); return `${y}-${m}-${d}`; };

// YAML: chuoi 1 dong -> JSON (YAML hop le); chuoi nhieu dong -> khoi |
function yaml(obj, indent = '') {
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      out += `${indent}${k}:\n`;
      for (const item of v) {
        if (typeof item === 'object' && !item.__json) {
          const inner = yaml(item, indent + '    ').replace(/^\s+/, '');
          out += `${indent}  - ${inner}`;
        } else out += `${indent}  - ${JSON.stringify(item.__json ?? item)}\n`;
      }
    } else if (typeof v === 'object') {
      out += `${indent}${k}:\n${yaml(v, indent + '  ')}`;
    } else if (typeof v === 'string' && v.includes('\n')) {
      out += `${indent}${k}: |-\n${v.split('\n').map((l) => indent + '  ' + l).join('\n')}\n`;
    } else out += `${indent}${k}: ${JSON.stringify(v)}\n`;
  }
  return out;
}

// Lay thong tin the "card" o trang danh sach blog
const $idx = cheerio.load(fs.readFileSync(`${OLD}/index.html`, 'utf8'), { decodeEntities: false });
const cards = {};
$idx('.blog-card').each((i, el) => {
  const c = $idx(el);
  const slug = c.find('.blog-card-link').attr('href').replace('.html', '');
  cards[slug] = {
    listOrder: i + 1,
    category: clean(c.find('.blog-card-category').text()) || undefined,
    title: clean(c.find('h3').text()),
    excerpt: clean(c.find('h3').next('p').text()),
    bg: clean(c.find('.blog-card-image').attr('style')),
    icons: dedent(c.find('.blog-card-image').html()),
    date: clean(c.find('.blog-card-meta span').first().text()),
    readTime: clean(c.find('.blog-card-meta span').eq(1).text()),
  };
});

const files = fs.readdirSync(OLD).filter((f) => f.endsWith('.html') && !['index.html', 'admin.html'].includes(f));
const report = [];
for (const f of files) {
  const slug = f.replace('.html', '');
  const $ = cheerio.load(fs.readFileSync(`${OLD}/${f}`, 'utf8').replace(/^﻿/, ''), { decodeEntities: false });
  const meta = (sel) => $(sel).attr('content') && clean($(sel).attr('content'));
  const canonical = $('link[rel=canonical]').attr('href');
  const expected = `${SITE}/blog/${f}`;
  if (canonical !== expected) report.push(`${slug}: canonical khac mau: ${canonical}`);
  if (meta('meta[property="og:url"]') !== canonical) report.push(`${slug}: og:url khac canonical`);
  if (meta('meta[property="og:image"]') !== 'https://cdn-icons-png.flaticon.com/512/5495/5495490.png') report.push(`${slug}: og:image rieng`);

  const h1 = $('.blog-header h1');
  const icon = h1.find('i').attr('class');
  h1.find('i').remove();
  const metaItems = $('.article-meta-item').map((i, e) => clean($(e).text())).get();
  if (metaItems[2] !== 'Tương Ớt Siêu Cay') report.push(`${slug}: tac gia khac: ${metaItems[2]}`);

  const body = $('.article-body');
  body.find('.share-buttons, .article-cta').remove();
  body.contents().filter((i, n) => n.type === 'comment').remove();

  const bottom = $('body > section').not('.blog-header');
  const card = cards[slug];
  if (!card) report.push(`${slug}: KHONG co card o trang danh sach`);
  else {
    if (card.date !== metaItems[0]) report.push(`${slug}: ngay o card (${card.date}) khac ngay trong bai (${metaItems[0]})`);
    if (card.readTime !== metaItems[1]) report.push(`${slug}: thoi gian doc o card (${card.readTime}) khac trong bai (${metaItems[1]})`);
  }

  const fm = {
    title: clean($('title').text()),
    description: meta('meta[name=description]'),
    keywords: meta('meta[name=keywords]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    twitterTitle: meta('meta[name="twitter:title"]'),
    twitterDescription: meta('meta[name="twitter:description"]'),
    heading: clean(h1.text()),
    headingIcon: icon,
    subtitle: clean($('.blog-header-content > p').text()) || undefined,
    breadcrumb: clean($('.breadcrumb .current').text()),
    date: isoDate(metaItems[0]),
    readTime: parseInt(metaItems[1], 10),
    headerStyle: clean($('.blog-header').attr('style')) || undefined,
    related: $('.related-card').map((i, e) => ({
      slug: $(e).attr('href').replace('.html', ''),
      icon: $(e).find('i').attr('class'),
      title: clean($(e).find('span').text()),
    })).get(),
    bottomCta: !bottom.length ? 'none' : squash($.html(bottom)) === DEFAULT_CTA ? 'default' : dedent($.html(bottom)),
    card: card && {
      listOrder: card.listOrder,
      category: card.category,
      title: card.title !== clean(h1.text()) ? card.title : undefined,
      excerpt: card.excerpt,
      bg: card.bg,
      icons: card.icons,
    },
    schema: $('script[type="application/ld+json"]').map((i, e) => ({ __json: JSON.parse($(e).text()) })).get(),
  };
  if (fm.related.length === 0) delete fm.related;
  fs.writeFileSync(`${OUT}/${slug}.md`, `---\n${yaml(fm)}---\n${dedent(body.html())}\n`);
}
console.log(`Da chuyen ${files.length} bai.`);
console.log(report.length ? 'Ghi chu:\n - ' + report.join('\n - ') : 'Khong co ngoai le.');
