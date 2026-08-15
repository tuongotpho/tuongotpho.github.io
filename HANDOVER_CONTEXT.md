# 📋 TÀI LIỆU BÀN GIAO DỰ ÁN (PROJECT HANDOVER CONTEXT)
> **Dành cho AI Assistant / Developer tiếp quản dự án Tương Ớt Bông Ớt**

---

## 1. 🌟 TỔNG QUAN THƯƠNG HIỆU & DỰ ÁN
- **Tên thương hiệu:** Tương Ớt Siêu Cay Gia Truyền Hà Nội - Bông Ớt.
- **Sản phẩm:** 100% ớt tươi nguyên chất, không chất bảo quản, không cà chua, không tỏi.
  - Chai Siêu Cay 350ml: **30.000₫**
  - Chai Truyền Thống 500ml: **45.000₫**
  - Mua Buôn / Quán Phở (Can theo Lít): **60.000₫ / Lít** (Can từ 5L trở lên)
- **Hotline / Zalo:** 0982.722.036
- **Địa chỉ Shop:** Số 8, ngõ 135 Núi Trúc, Giảng Võ, Hà Nội.
- **Link Google Maps:** `https://maps.app.goo.gl/Kgb7iHMjhNCQFnSu9`

---

## 2. 🌐 HỆ THỐNG MẠNG LƯỚI 4 WEB (MULTI-HOSTING & CI/CD)
Mã nguồn được quản lý tập trung duy nhất tại repository Master:
👉 **`tuongotpho/tuongotpho.github.io`** (nhánh `main`)

Khi có commit mới trên `tuongotpho`, GitHub Actions (`.github/workflows/deploy.yml`) sẽ tự động xuất bản lên cả 4 website:
1. **GitHub Pages 1:** `https://tuongotpho.github.io/`
2. **GitHub Pages 2:** `https://tuongotcay.github.io/` (Tự động sync qua PAT Token)
3. **Firebase Hosting 1:** `https://tuongot-sieucay.web.app` (Project: `tuongot-sieucay`)
4. **Firebase Hosting 2:** `https://tuongotsieucay.web.app`

---

## 3. 📂 CẤU TRÚC CODEBASE ĐÃ ĐƯỢC CHUẨN HÓA
```text
├── .github/workflows/
│   └── deploy.yml          # CI/CD tự động sync tuongotcay và deploy 2 site Firebase
├── blog/                   # 13 bài viết SEO Content và trang blog/index.html
├── images/                 # Hình ảnh sản phẩm, logo, gallery
├── .firebaserc             # Cấu hình dự án Firebase Hosting
├── firebase.json           # Cấu hình multi-site hosting (tuongot-sieucay & tuongotsieucay)
├── index.html              # Landing page chính (Hero, Sản phẩm, Review, FAQ, Map, Giỏ hàng)
├── app.html                # Telegram Mini App chuyên dụng (Đặt hàng nhanh 3 sản phẩm, tính tiền realtime)
├── gallery.html            # Trang bộ sưu tập hình ảnh
├── robots.txt              # Khai báo bot tìm kiếm
├── sitemap.xml             # Sitemap XML 18 URL canonical chuẩn SEO Google
├── script.js               # Logic giỏ hàng, Telegram API direct, Formspree
├── script.min.js           # File JS đồng bộ
├── styles.css              # Giao diện chính Master
└── styles.min.css          # File CSS đồng bộ
```

---

## 4. 🤖 CẤU HÌNH TELEGRAM BOT & SERVERLESS ORDERING
Hệ thống đặt hàng hoạt động theo cơ chế **Serverless 100%** (Gọi trực tiếp Telegram Bot API, không cần server trung gian):
- **Bot Token:** `8571697852:AAGhE7cw3Sx3vWoX1SF1jovESawYsngBwXo`
- **Bot Username:** `@khachtuongot_bot`
- **Chat ID Chủ Shop:** `5056715300` (Lê Thanh - `@august8787`)

### ⚡ Các tính năng Telegram Bot đã hoàn thiện:
1. **Telegram Mini App (`app.html`)**:
   - Khách mở bot bấm `[🛍 Đặt Hàng Nhanh]` mở ra trang `app.html`.
   - Tự động lấy Họ Tên từ Telegram User Profile.
   - Chọn số lượng chai 350ml, 500ml và số Lít mua buôn (+/-), tự tính tổng tiền trực tiếp.
   - Nút đặt hàng chuẩn Native Telegram MainButton + Rung Haptic Feedback.
2. **Thông báo đơn hàng kèm nút bấm thông minh**:
   - Khi có đơn mới, bot bắn tin nhắn về Chat ID `5056715300` kèm nút:
     - `[ ✅ Xác Nhận Đơn & Báo Khách ]`
     - `[ 💬 Chat Zalo ]`
     - `[ 📍 Vị Trí Shop ]`
3. **Tự động gửi tin nhắn duyệt đơn cho khách (Auto-Reply)**:
   - Khi chủ shop bấm `[ ✅ Xác Nhận Đơn & Báo Khách ]`, bot tự động gửi tin nhắn riêng cho Telegram của khách báo đơn đã được duyệt và đang chuẩn bị giao.

---

## 5. 🔍 TỐI ƯU SEO & AI SEARCH (GEO) ĐÃ THỰC HIỆN
- Đầy đủ thẻ Meta Title, Description, OpenGraph, Canonical.
- Cấu trúc dữ liệu Schema.org JSON-LD: `LocalBusiness`, `Product`, `AggregateRating`, `FAQPage`.
- Khối Câu hỏi thường gặp (Q&A) trực quan trên trang chủ và khớp 100% với JSON-LD Schema.
- Bản đồ Google Maps nhúng trực tiếp toạ độ chuẩn `Kgb7iHMjhNCQFnSu9`.

---

## 6. 🔐 SECRETS TRÊN GITHUB ACTIONS
Đã cấu hình tại `tuongotpho/tuongotpho.github.io` ➔ Settings ➔ Secrets:
- `PAT_TOKEN`: Token quyền `repo` để đẩy code sang `tuongotcay.github.io`.
- `FIREBASE_SERVICE_ACCOUNT_TUONGOT_SIECAY`: Private Key JSON triển khai Firebase Hosting.
