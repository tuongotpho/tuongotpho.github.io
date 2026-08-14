# Tương Ớt Bông Ớt - Master Website (Multi-Domain & Multi-Hosting)

Hệ thống mã nguồn website chính thức của thương hiệu **Tương Ớt Bông Ớt** (Gia truyền Hà Nội - 100% ớt tươi nguyên chất, không chất bảo quản).

---

## 🌐 Hệ Thống Tự Động Hóa 4 Web (CI/CD)

Mã nguồn được quản lý tập trung duy nhất tại repository này (`tuongotpho/tuongotpho.github.io`). Khi có commit mới, **GitHub Actions** tự động xuất bản lên cả 4 trang web:

1. **[tuongotpho.github.io](https://tuongotpho.github.io/)** *(GitHub Pages 1)*
2. **[tuongotcay.github.io](https://tuongotcay.github.io/)** *(GitHub Pages 2)*
3. **[tuongot-sieucay.web.app](https://tuongot-sieucay.web.app/)** *(Firebase Hosting Site 1)*
4. **[tuongotsieucay.web.app](https://tuongotsieucay.web.app/)** *(Firebase Hosting Site 2)*

---

## 📂 Cấu Trúc Dự Án Đã Chuẩn Hóa

```text
├── .github/workflows/
│   └── deploy.yml          # Kịch bản CI/CD tự động deploy 4 web
├── blog/                   # Thư mục bài viết Blog chuẩn SEO Content
│   ├── index.html          # Trang danh sách bài viết
│   └── *.html              # 13 bài viết chia sẻ kiến thức ẩm thực & sức khỏe
├── images/                 # Hình ảnh sản phẩm, gallery và đồ họa
├── .firebaserc             # Cấu hình dự án Firebase (tuongot-sieucay)
├── firebase.json           # Cấu hình Multi-site Hosting (2 sites)
├── gallery.html            # Trang bộ sưu tập ảnh sản phẩm & món ăn
├── index.html              # Trang chủ Master (Giỏ hàng, Đánh giá, Hero Animation)
├── robots.txt              # Khai báo Bot tìm kiếm và Sitemap
├── script.js               # Mã nguồn JS (Giỏ hàng, Telegram Bot API, Formspree)
├── script.min.js           # Phiên bản JS tối ưu nén
├── sitemap.xml             # Sitemap XML chuẩn SEO chứa đầy đủ 17 URL
├── styles.css              # Mã nguồn CSS giao diện hiện đại
└── styles.min.css          # Phiên bản CSS tối ưu nén
```

---

## ⚡ Các Tính Năng Nổi Bật

1. **Đặt Hàng & Thông Báo Tức Thì**:
   - Tích hợp **Telegram Bot API**: Đơn hàng tự động gửi trực tiếp về Telegram cá nhân/nhóm của chủ shop ngay khi khách đặt.
   - Hỗ trợ **Giỏ hàng trực tiếp (Cart Modal)** trên web + Liên hệ Zalo / Hotline.
2. **Tối Ưu SEO & AI Search (AIO / GEO)**:
   - Cấu trúc dữ liệu có cấu trúc Schema.org (`LocalBusiness`, `Product`, `FAQPage`, `BreadcrumbList`).
   - Sitemap XML đầy đủ 17 URL canonical giúp Google lập chỉ mục nhanh chóng.
   - 13 bài viết Blog chuẩn SEO kéo traffic tự nhiên từ công cụ tìm kiếm.
3. **Tracking & Analytics**:
   - Tích hợp **Google Analytics GA4** và **Firebase Analytics SDK** (`G-536YB7K3WV`).

---

## 📞 Liên Hệ

- **Hotline / Zalo:** 0982.722.036
- **Địa chỉ:** Số 8, ngõ 135 Núi Trúc, Giảng Võ, Ba Đình, Hà Nội
