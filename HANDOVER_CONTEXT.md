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

- 🌐 **ĐỊA CHỈ WEB CHÍNH THỨC:** 👉 **`https://tuongotsieucay.web.app/`**
- 🛒 **TRANG ĐẶT HÀNG NHANH 30 GIÂY:** 👉 **`https://tuongotsieucay.web.app/app.html`**
- Hệ thống mạng lưới 4 website đồng bộ tự động qua GitHub Actions (`.github/workflows/deploy.yml`):
  1. **Website Chính thức (Firebase):** `https://tuongotsieucay.web.app/`
  2. **Trang Đặt Mua Trực Tuyến:** `https://tuongotsieucay.web.app/app.html`
  3. **Firebase Hosting 2:** `https://tuongot-sieucay.web.app` (Project: `tuongot-sieucay`)
  4. **GitHub Pages 1:** `https://tuongotpho.github.io/`
  5. **GitHub Pages 2:** `https://tuongotcay.github.io/` (Tự động sync qua PAT Token)

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

## 4. 🤖 TELEGRAM BOT & LUỒNG ĐẶT HÀNG

- **Bot Username:** `@khachtuongot_bot`
- **Chat ID Chủ Shop:** `5056715300` (Lê Thanh - `@august8787`)
- **Bot Token:** nằm trong Google Secret Manager (`TELEGRAM_BOT_TOKEN`), **không có trong mã nguồn**.

> ⚠️ **Tuyệt đối không đặt bot token vào bất kỳ file HTML/JS nào.** Toàn bộ web là
> trang tĩnh công khai, ai cũng xem được mã nguồn. Token từng nằm trong `script.js`
> và `app.html` — nó đã bị lộ và phải revoke. Mọi liên lạc với Telegram đi qua
> Cloud Function.

### Luồng đặt hàng
Khách (web hoặc Telegram Mini App) → `POST /api/order` → Cloud Function:
1. Xác thực chữ ký `initData` nếu đặt từ Telegram
2. Tính lại tiền từ bảng giá phía server, bỏ qua giá client gửi lên
3. Ghi đơn vào Firestore, cấp mã `BO-YYMMDD-NNN`
4. Bắn tin cho chủ shop kèm nút `[✅ Xác Nhận Đơn]` `[💬 Chat Zalo]` `[📍 Vị Trí Shop]`

Đơn được **ghi vào Firestore trước khi gọi Telegram**, nên Telegram lỗi hay bị nhà
mạng chặn thì đơn vẫn còn nguyên và khách vẫn nhận được mã đơn.

### Xác nhận đơn
Nút `[✅ Xác Nhận Đơn]` dùng `callback_data`, xử lý bởi function `telegramWebhook`.
Chốt bằng transaction nên bấm 2 lần chỉ báo khách 1 lần. Tin nhắn đơn tự sửa thành
`✅ ĐÃ XÁC NHẬN lúc HH:mm`. Đơn đặt từ web cũng bấm được (ghi vào sổ để theo dõi).

Chi tiết vận hành, cách đổi token và cách chạy thử: xem `functions/README.md`.

---

## 5. 🔍 TỐI ƯU SEO & AI SEARCH (GEO) ĐÃ THỰC HIỆN
- Đầy đủ thẻ Meta Title, Description, OpenGraph, Canonical.
- Cấu trúc dữ liệu Schema.org JSON-LD: `LocalBusiness`, `Product`, `AggregateRating`, `FAQPage`.
- Khối Câu hỏi thường gặp (Q&A) trực quan trên trang chủ và khớp 100% với JSON-LD Schema.
- Bản đồ Google Maps nhúng trực tiếp toạ độ chuẩn `Kgb7iHMjhNCQFnSu9`.

---


---

## 7. 📘 FANPAGE FACEBOOK & CÔNG CỤ TỰ ĐỘNG ĐĂNG BÀI
- **Tên Fanpage:** `Tương ớt Cay Nguyên chất Bông Ớt`
- **Page ID:** `1128561193950526`
- **Link Fanpage:** `https://www.facebook.com/1128561193950526` (hoặc `tuongotcaynguyenchatbongot`)
- **Công cụ tự động hóa:** `facebook-manager.js` (quản lý trạng thái, đăng bài tự động, đăng tự động từ 13 bài Blog SEO).
  - Kiểm tra trạng thái Fanpage: `node facebook-manager.js status`
  - Đăng bài viết tức thì: `node facebook-manager.js post --message "..." [--link "..."]`
  - Đăng bài viết từ Blog: `node facebook-manager.js post-blog <ten-bai-viet>`
- **Bảo mật:** Token lưu tại `fb-config.json` (đã thêm vào `.gitignore`, không commit lên GitHub công khai).

