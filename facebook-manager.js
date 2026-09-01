/**
 * FACEBOOK FANPAGE AUTOMATION MANAGER
 * Dành cho: Tương ớt Cay Nguyên chất Bông Ớt
 * Fanpage ID: 1128561193950526
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'fb-config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Không tìm thấy file cấu hình fb-config.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

const config = loadConfig();
const API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * 1. Kiểm tra trạng thái Fanpage & danh sách bài viết gần đây
 */
async function checkStatus() {
  console.log('🔄 Đang kiểm tra trạng thái Fanpage...');
  const res = await fetch(`${API_BASE}/${config.page_id}?fields=id,name,fan_count,followers_count,link&access_token=${config.access_token}`);
  const data = await res.json();

  if (data.error) {
    console.error('❌ Lỗi kết nối Facebook API:', data.error.message);
    return;
  }

  console.log('\n========================================');
  console.log(`✅ FANPAGE: ${data.name}`);
  console.log(`🆔 ID: ${data.id}`);
  console.log(`🔗 Link: ${data.link || `https://facebook.com/${data.id}`}`);
  console.log(`👥 Người theo dõi: ${data.followers_count || 0}`);
  console.log('========================================\n');

  // Lấy 3 bài viết gần nhất
  const feedRes = await fetch(`${API_BASE}/${config.page_id}/feed?limit=3&fields=message,created_time,shares,comments.summary(true),likes.summary(true)&access_token=${config.access_token}`);
  const feedData = await feedRes.json();

  console.log('📝 3 BÀI VIẾT GẦN NHẤT:');
  if (feedData.data && feedData.data.length > 0) {
    feedData.data.forEach((p, idx) => {
      const time = new Date(p.created_time).toLocaleString('vi-VN');
      const likes = p.likes?.summary?.total_count || 0;
      const comments = p.comments?.summary?.total_count || 0;
      console.log(`\n[${idx + 1}] Lúc ${time} (👍 ${likes} likes, 💬 ${comments} cmt):`);
      console.log(p.message ? p.message.slice(0, 150) + '...' : '(Ảnh / Cập nhật)');
    });
  } else {
    console.log('Chưa có bài viết nào gần đây.');
  }
}

/**
 * 2. Đăng bài viết mới lên Fanpage
 */
async function createPost({ message, link, imagePath, scheduledTime }) {
  console.log('🚀 Đang chuẩn bị đăng bài lên Fanpage...');

  const params = new URLSearchParams();
  params.append('access_token', config.access_token);
  params.append('message', message);

  if (link) {
    params.append('link', link);
  }

  if (scheduledTime) {
    // Thời gian hẹn giờ (UNIX timestamp theo giây)
    const timestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
    params.append('published', 'false');
    params.append('scheduled_publish_time', timestamp.toString());
    console.log(`⏰ Lên lịch đăng vào lúc: ${new Date(scheduledTime).toLocaleString('vi-VN')}`);
  }

  try {
    const res = await fetch(`${API_BASE}/${config.page_id}/feed`, {
      method: 'POST',
      body: params
    });
    const result = await res.json();

    if (result.error) {
      console.error('❌ Đăng bài thất bại:', result.error.message);
      return result;
    }

    console.log('🎉 ĐĂNG BÀI THÀNH CÔNG!');
/**
 * 2b. Đăng bài viết kèm Ảnh trực tiếp (Photo Post tràn viền cực đẹp)
 */
async function createPhotoPost({ caption, imageUrl, imagePath }) {
  console.log('🚀 Đang chuẩn bị đăng bài kèm ảnh lên Fanpage...');

  const params = new URLSearchParams();
  params.append('access_token', config.access_token);
  params.append('caption', caption);

  if (imageUrl) {
    params.append('url', imageUrl);
  } else if (imagePath) {
    // Nếu truyền ảnh local, dùng URL online tương ứng hoặc tải lên
    const basename = path.basename(imagePath);
    params.append('url', `https://tuongotsieucay.web.app/images/${basename}`);
  } else {
    // Mặc định dùng ảnh banner đẹp của shop
    params.append('url', 'https://tuongotsieucay.web.app/images/tuong-ot-bong-ot-banner.jpg');
  }

  try {
    const res = await fetch(`${API_BASE}/${config.page_id}/photos`, {
      method: 'POST',
      body: params
    });
    const result = await res.json();

    if (result.error) {
      console.error('❌ Đăng bài kèm ảnh thất bại:', result.error.message);
      return result;
    }

    console.log('🎉 ĐĂNG BÀI KÈM ẢNH BÌA THÀNH CÔNG!');
    console.log(`🆔 Mã bài viết (Post ID): ${result.post_id || result.id}`);
    console.log(`🔗 Xem bài viết: https://facebook.com/${result.post_id || result.id}`);
    return result;
  } catch (err) {
    console.error('❌ Lỗi kết nối mạng:', err);
  }
}


/**
 * 3. Tự động chuyển bài viết Blog SEO thành Post Fanpage
 */
async function postBlogArticle(blogSlug) {
  const blogDir = path.join(__dirname, 'blog');
  let filename = blogSlug.endsWith('.html') ? blogSlug : `${blogSlug}.html`;
  const filePath = path.join(blogDir, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Không tìm thấy bài viết: ${filePath}`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');

  // Trích xuất Title và Meta Description
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);

  const title = (h1Match ? h1Match[1] : (titleMatch ? titleMatch[1] : 'Tương Ớt Bông Ớt')).replace(/<[^>]+>/g, '').trim();
  const desc = descMatch ? descMatch[1] : 'Đọc bài viết chia sẻ ẩm thực và văn hóa ăn cay cùng Tương Ớt Bông Ớt!';
  const url = `https://tuongotsieucay.web.app/blog/${filename}`;

  const message = `🌶️ BÍ QUYẾT ẨM THỰC: ${title.toUpperCase()} 🔥


${desc}

👉 Đọc ngay bài viết chi tiết tại:
🌐 ${url}

---
🌶️ TƯƠNG ỚT SIÊU CAY GIA TRUYỀN - BÔNG ỚT
✅ 100% ớt tươi nguyên chất - Không cà chua - Không tỏi - Không chất bảo quản
📦 Chai 350ml (30k) | Chai 500ml (45k) | Can 5L cho quán (60k/L)
📞 Hotline/Zalo: 0982.722.036
📍 Số 8, ngõ 135 Núi Trúc, Giảng Võ, Ba Đình, Hà Nội

#TuongOtBongOt #TuongOtGiaTruyen #AmThucHaNoi #MeCay #TuongOtPho`;

  return await createPost({ message, link: url });
}

// Xử lý CLI Arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      await checkStatus();
      break;

    case 'post':
      const msgIndex = args.indexOf('--message');
      const linkIndex = args.indexOf('--link');
      if (msgIndex === -1 || !args[msgIndex + 1]) {
        console.log('Cách dùng: node facebook-manager.js post --message "Nội dung bài viết" [--link "https://..."]');
        return;
      }
      const message = args[msgIndex + 1];
      const link = linkIndex !== -1 ? args[linkIndex + 1] : null;
      await createPost({ message, link });
      break;

    case 'post-photo':
      const capIndex = args.indexOf('--caption') !== -1 ? args.indexOf('--caption') : args.indexOf('--message');
      const imgIndex = args.indexOf('--image');
      if (capIndex === -1 || !args[capIndex + 1]) {
        console.log('Cách dùng: node facebook-manager.js post-photo --caption "Nội dung" [--image "ten_anh.jpg"]');
        return;
      }
      const caption = args[capIndex + 1];
      const img = imgIndex !== -1 ? args[imgIndex + 1] : null;
      await createPhotoPost({ caption, imageUrl: img && img.startsWith('http') ? img : null, imagePath: img && !img.startsWith('http') ? img : null });
      break;


    case 'post-blog':
      const blogName = args[1];
      if (!blogName) {
        console.log('Cách dùng: node facebook-manager.js post-blog <ten-file-blog>');
        console.log('Ví dụ: node facebook-manager.js post-blog cach-bao-quan-tuong-ot');
        return;
      }
      await postBlogArticle(blogName);
      break;

    default:
      console.log(`Lệnh không hợp lệ: ${command}`);
      console.log('Các lệnh có sẵn:');
      console.log('  node facebook-manager.js status');
      console.log('  node facebook-manager.js post --message "..."');
      console.log('  node facebook-manager.js post-blog <ten-bai-blog>');
      break;
  }
}

main();
