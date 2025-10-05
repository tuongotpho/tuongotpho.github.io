# 🌶️ Tương Ớt Siêu Cay - Landing Page

Landing page quảng cáo và bán tương ớt siêu cay nguyên chất với thiết kế hiện đại và tính năng mua hàng trực tuyến.

## 🔥 Tính Năng Chính

- **Thiết kế hiện đại**: Giao diện đẹp mắt với hiệu ứng động và responsive design
- **Giỏ hàng thông minh**: Thêm/xóa sản phẩm, tính toán tổng tiền tự động
- **Form liên hệ**: Gửi thông tin khách hàng và lưu trữ localStorage
- **Tối ưu SEO**: Meta tags và cấu trúc HTML chuẩn
- **Tương thích đa thiết bị**: Mobile-first responsive design

## 📁 Cấu Trúc File

```
tuong-ot-sieu-cay/
├── index.html          # Trang chủ chính
├── styles.css          # Styles và responsive design
├── script.js           # JavaScript functionality
└── README.md           # Hướng dẫn sử dụng
```

## 🚀 Hướng Dẫn Triển Khai Miễn Phí

### 1. **GitHub Pages** (Khuyến nghị)
```bash
# Tạo repository mới trên GitHub
# Upload các file vào repository
# Vào Settings > Pages
# Chọn "main" branch và "/root" folder
# Website sẽ có URL: https://username.github.io/repository-name
```

### 2. **Netlify** (Drag & Drop)
- Truy cập [netlify.com](https://netlify.com)
- Kéo thả folder chứa các file vào vùng upload
- Website sẽ được deploy tự động với URL miễn phí

### 3. **Vercel** (Từ GitHub)
- Kết nối repository GitHub với Vercel
- Deploy tự động khi push code
- Hỗ trợ custom domain miễn phí

### 4. **Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 5. **Local Development**
Để chạy local:
```bash
# Mở file index.html trực tiếp trong trình duyệt
# Hoặc sử dụng Live Server extension trong VS Code
```

## 🎨 Thiết Kế Landing Page

### **Hero Section**
- Tiêu đề hấp dẫn với font chữ đẹp
- Mô tả sản phẩm ngắn gọn nhưng thu hút
- Nút CTA (Call-to-Action) nổi bật
- Hình ảnh sản phẩm với hiệu ứng động

### **Products Section**
- 3 sản phẩm chính với mức độ cay khác nhau
- Thiết kế card đẹp mắt với giá cả rõ ràng
- Badge "Bán chạy nhất" cho sản phẩm nổi bật

### **About Section**
- Thông tin về công ty và sản phẩm
- Đặc điểm nổi bật của sản phẩm
- Nguyên liệu và quy trình sản xuất

### **Testimonials**
- Khách hàng đánh giá tích cực
- Thiết kế testimonial cards đẹp mắt

### **Contact Section**
- Thông tin liên hệ đầy đủ
- Form liên hệ với validation

## 💰 Chiến Lược Bán Hàng

### **Pricing Strategy**
- Sản phẩm cao cấp: ₫35,000 (giảm từ ₫45,000)
- Sản phẩm phổ biến: ₫25,000 (giảm từ ₫30,000)
- Sản phẩm mới: ₫22,000 (giảm từ ₫28,000)

### **Marketing Points**
- **100% Nguyên Chất**: Không chất bảo quản
- **Độ Cay Đỉnh Cao**: Ớt tươi tuyển chọn
- **Sản Xuất Trong Nước**: Hỗ trợ nông dân Việt Nam

## 📱 Responsive Design

- **Desktop**: Layout 2 cột, hiển thị đầy đủ tính năng
- **Tablet**: Điều chỉnh layout phù hợp
- **Mobile**: Single column, tối ưu trải nghiệm touch

## 🛠️ Công Nghệ Sử dụng

- **HTML5**: Semantic markup, accessibility
- **CSS3**: Flexbox, Grid, animations
- **JavaScript ES6+**: Modern features, localStorage
- **Font Awesome**: Icons miễn phí
- **Google Fonts**: Typography đẹp

## 🔧 Customization

### Thay đổi màu sắc
Trong `styles.css`, tìm các biến màu:
```css
:root {
  --primary-color: #8b0000;
  --secondary-color: #ff6b35;
  --accent-color: #ffe135;
}
```

### Thêm sản phẩm mới
Trong `index.html`, thêm vào `.products-grid`:
```html
<div class="product-card">
  <!-- Nội dung sản phẩm mới -->
</div>
```

### Chỉnh sửa nội dung
- Cập nhật thông tin sản phẩm trong HTML
- Thay đổi giá cả và mô tả
- Điều chỉnh thông tin liên hệ

## 📊 Tính Năng JavaScript

- **Cart Management**: Lưu trữ giỏ hàng localStorage
- **Form Validation**: Kiểm tra dữ liệu form
- **Smooth Scrolling**: Điều hướng mượt mà
- **Animations**: Hiệu ứng khi tải trang
- **Notifications**: Thông báo tương tác

## 🌐 SEO Optimization

- Meta description hấp dẫn
- Open Graph tags cho social media
- Alt text cho hình ảnh
- Semantic HTML structure
- Fast loading performance

## 📞 Liên Hệ và Hỗ Trợ

Để được tư vấn thêm về sản phẩm hoặc kỹ thuật:
- **Điện thoại**: 0123 456 789
- **Email**: info@tuongotsieucay.vn
- **Địa chỉ**: 123 Đường Ớt Cay, Quận 1, TP.HCM

## 📈 Mẹo Tối Ưu Doanh Thu

1. **A/B Testing**: Thử nghiệm các phiên bản khác nhau
2. **Social Proof**: Thêm nhiều testimonial hơn
3. **Urgency**: Thêm countdown timer cho khuyến mãi
4. **Upselling**: Gợi ý sản phẩm liên quan
5. **Email Marketing**: Thu thập email khách hàng

## 🔒 Bảo Mật và Privacy

- Không lưu thông tin nhạy cảm
- Sử dụng HTTPS khi triển khai
- Tuân thủ GDPR cho dữ liệu khách hàng

---

**Chúc bạn kinh doanh thành công với landing page tương ớt siêu cay!** 🌶️🔥