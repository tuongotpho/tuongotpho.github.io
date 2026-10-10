# Blog Tương Ớt — nguồn Astro

Các trang trong thư mục `blog/` của web **được sinh ra từ đây**. Đừng sửa tay `blog/*.html`
(trừ công cụ `admin.html`), vì lần build sau sẽ bị ghi đè.

| Muốn sửa | Sửa file |
|---|---|
| Nội dung 1 bài | `src/content/blog/<ten-bai>.md` |
| Menu, chân trang, Google Analytics (mọi trang) | `src/layouts/BlogLayout.astro` |
| Khối "Đặt hàng" + nút chia sẻ cuối mỗi bài (giá, số điện thoại) | `src/components/OrderBox.astro` |
| Dải "Thử ngay tương ớt" phía dưới bài | `src/components/BottomCta.astro` |
| Trang danh sách blog | `src/pages/blog/index.astro` |

## Thêm bài mới

Tạo file `src/content/blog/ten-bai-khong-dau.md`. Tên file chính là địa chỉ trang
(`blog/ten-bai-khong-dau.html`). Nội dung tối thiểu:

```markdown
---
title: "Tiêu đề hiện trên Google | Blog Tương Ớt Siêu Cay"
description: "Mô tả 1-2 câu hiện dưới tiêu đề trên Google."
heading: "Tiêu đề lớn trong bài"
date: 2026-10-15
readTime: 5
---

Đoạn mở bài viết bình thường. **In đậm**, *in nghiêng*.

## Tiêu đề mục

- Gạch đầu dòng
- [Link sang bài khác](cach-bao-quan-tuong-ot.html)
```

Các ô tuỳ chọn khác (biểu tượng, phụ đề, bài liên quan, thẻ ở trang danh sách...) xem
trong `src/content.config.ts` hoặc copy từ một bài cũ. Bài mới tự lên **đầu** trang danh
sách, tự có khối đặt hàng, tự có JSON-LD cho Google, tự được thêm vào `sitemap.xml`.
Đặt `draft: true` để soạn nháp mà chưa đăng.

## Build (gõ trong PowerShell, tại thư mục `astro`)

```
npm install        # chỉ lần đầu
npm run build      # sinh lại blog/*.html + cập nhật sitemap.xml
npm run dev        # xem thử bài trong lúc viết (http://localhost:4321/blog/)
```

Sau khi build thì commit cả `astro/` lẫn `blog/`. GitHub có job **"Kiem tra blog Astro"**:
nếu sửa `.md` mà quên build, job này báo đỏ.

`npm run dev` chỉ để xem nội dung; CSS dùng chung của web (`../styles.min.css`) không có ở
chế độ này nên giao diện sẽ thiếu màu — xem đúng giao diện thì build rồi mở file trong `blog/`.
