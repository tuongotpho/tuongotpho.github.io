import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),                       // the <title> (hien tren tab va Google)
    description: z.string(),
    keywords: z.string().optional(),
    ogTitle: z.string().optional(),          // bo trong = dung heading
    ogDescription: z.string().optional(),    // bo trong = dung description
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    heading: z.string(),                     // tieu de lon H1 trong bai
    headingIcon: z.string().default('fas fa-pepper-hot'),
    subtitle: z.string().optional(),         // dong chu nho duoi tieu de lon
    breadcrumb: z.string().optional(),       // bo trong = dung heading
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readTime: z.number().int().positive(),
    headerStyle: z.string().optional(),
    related: z.array(z.object({ slug: z.string(), icon: z.string(), title: z.string() })).default([]),
    bottomCta: z.string().default('default'), // 'default' | 'none' | HTML rieng
    card: z.object({
      listOrder: z.number().optional(),
      category: z.string().optional(),
      title: z.string().optional(),
      excerpt: z.string().optional(),
      bg: z.string().optional(),
      icons: z.string().optional(),
    }).default({}),
    schema: z.array(z.record(z.string(), z.any())).optional(), // JSON-LD; bo trong = tu sinh Article
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
