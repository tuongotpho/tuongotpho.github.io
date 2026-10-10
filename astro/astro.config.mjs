import { defineConfig } from 'astro/config';

// Chi sinh trang blog. Ket qua build nam o dist/, script publish.mjs chep sang ../blog/
export default defineConfig({
  site: 'https://tuongotcay.github.io',
  build: { format: 'preserve' },
  // Giu khoang trang giua cac the de chu khong bi dinh nhau
  compressHTML: false,
  // Than bai cu la HTML viet tay: khong cho Markdown "lam dep" dau ngoac kep
  markdown: { smartypants: false },
});
