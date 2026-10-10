import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = 'https://tuongotcay.github.io';
export const postUrl = (slug: string) => `${SITE}/blog/${slug}.html`;

// dd/mm/yyyy nhu cach hien thi cu
export const vnDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// Bai moi (khong co listOrder) dung dau, xep ngay moi -> cu; bai cu giu thu tu cu.
export async function getPosts() {
  const posts = await getCollection('blog', (p) => !p.data.draft);
  return posts.sort((a, b) => {
    const oa = a.data.card.listOrder, ob = b.data.card.listOrder;
    if (oa === undefined && ob === undefined) return b.data.date.getTime() - a.data.date.getTime();
    if (oa === undefined) return -1;
    if (ob === undefined) return 1;
    return oa - ob;
  });
}

// JSON-LD tu sinh cho bai moi khong khai bao schema
export function defaultSchema(p: CollectionEntry<'blog'>) {
  const org = { '@type': 'Organization', name: 'Tương Ớt Siêu Cay' };
  return [{
    '@context': 'https://schema.org', '@type': 'Article', headline: p.data.heading,
    author: org, datePublished: isoDate(p.data.date), dateModified: isoDate(p.data.updated ?? p.data.date),
    publisher: org, mainEntityOfPage: postUrl(p.id),
  }];
}
