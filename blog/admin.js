// Admin Panel - AI Blog Generator
// Uses Gemini API for content + GitHub API for publishing
//
// Bai blog gio la file Markdown trong astro/src/content/blog/ (nguon Astro).
// GitHub Actions tu build ra blog/*.html, cap nhat trang danh sach + sitemap roi deploy.
// Repo ghi vao la repo GOC (tuongotpho) - repo tuongotcay chi la ban sao bi ghi de moi lan deploy.

const CONFIG = {
    REPO_OWNER: 'tuongotpho',
    REPO_NAME: 'tuongotpho.github.io',
    BLOG_PATH: 'blog',
    POSTS_PATH: 'astro/src/content/blog',
    SITE_URL: 'https://tuongotsieucay.web.app',
    GA_ID: 'G-6JHML7VMEB',
    BRAND: 'Tương Ớt Siêu Cay',
    PHONE: '0982 722 036',
    EMAIL: 'vietthanh228@gmail.com',
};

let state = {
    geminiKey: localStorage.getItem('geminiKey') || '',
    githubToken: localStorage.getItem('githubToken') || '',
    geminiModel: localStorage.getItem('geminiModel') || 'gemini-2.0-flash-001',
    generatedHTML: '',
    generatedContent: '',
    articleSlug: '',
    articleTitle: '',
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('geminiKey').value = state.geminiKey;
    document.getElementById('githubToken').value = state.githubToken;
    if (document.getElementById('geminiModel')) document.getElementById('geminiModel').value = state.geminiModel;
    updateStatus();
});

function saveKeys() {
    state.geminiKey = document.getElementById('geminiKey').value.trim();
    state.githubToken = document.getElementById('githubToken').value.trim();
    const modelEl = document.getElementById('geminiModel');
    if (modelEl) { state.geminiModel = modelEl.value; localStorage.setItem('geminiModel', state.geminiModel); }
    localStorage.setItem('geminiKey', state.geminiKey);
    localStorage.setItem('githubToken', state.githubToken);
    updateStatus();
    showToast('Đã lưu API keys!', 'success');
}

function updateStatus() {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    if (state.geminiKey && state.githubToken) {
        dot.classList.add('connected');
        txt.textContent = 'Sẵn sàng';
    } else {
        dot.classList.remove('connected');
        txt.textContent = 'Chưa cấu hình';
    }
}

// ============ GENERATE CONTENT ============
async function generateArticle() {
    const topic = document.getElementById('topic').value.trim();
    const style = document.getElementById('style').value;
    const extraNotes = document.getElementById('extraNotes').value.trim();

    if (!topic) return showToast('Vui lòng nhập chủ đề!', 'error');
    if (!state.geminiKey) return showToast('Vui lòng nhập Gemini API Key!', 'error');

    const btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Đang tạo bài viết...';
    showPreviewLoading();
    addLog('Bắt đầu tạo bài viết: ' + topic);

    try {
        const prompt = buildPrompt(topic, style, extraNotes);
        const content = await callGemini(prompt);
        state.generatedContent = content;
        state.articleTitle = topic;
        state.articleSlug = createSlug(topic);

        addLog('AI đã tạo xong nội dung');
        renderPreview(content);
        document.getElementById('btnPublish').disabled = false;
        showToast('Tạo bài viết thành công!', 'success');
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
        addLog('LỖI: ' + err.message);
        showPreviewPlaceholder();
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Tạo Bài Viết với AI';
    }
}

function buildPrompt(topic, style, extraNotes) {
    const today = new Date().toLocaleDateString('vi-VN');
    return `Bạn là chuyên gia viết blog SEO cho website bán tương ớt "Tương Ớt Siêu Cay Bông Ớt".
Sản phẩm: tương ớt nguyên chất 100% từ ớt tươi, KHÔNG tỏi, KHÔNG cà chua, không chất bảo quản, lên men tự nhiên với muối biển.
SĐT: 0982 722 036. Địa chỉ: Số 8 phố 135 Núi Trúc, Giảng Võ, Hà Nội.

Hãy viết một bài blog HOÀN CHỈNH về chủ đề: "${topic}"
Phong cách: ${style}
${extraNotes ? 'Ghi chú thêm: ' + extraNotes : ''}
Ngày đăng: ${today}

YÊU CẦU FORMAT - Trả về JSON với cấu trúc CHÍNH XÁC sau:
{
  "title": "Tiêu đề bài viết hấp dẫn, có keyword chính",
  "slug": "tieu-de-khong-dau-ngan-cach-bang-gach-ngang",
  "metaDescription": "Mô tả 150-160 ký tự cho SEO",
  "keywords": "keyword1, keyword2, keyword3, ...(8-12 keywords)",
  "readTime": "X phút đọc",
  "icon": "fas fa-icon-name (Font Awesome 6)",
  "headerGradient": "rgba(r,g,b,0.2), rgba(r,g,b,0.1)",
  "sections": [
    {
      "type": "intro",
      "content": "Đoạn mở đầu hấp dẫn..."
    },
    {
      "type": "heading",
      "icon": "fas fa-icon",
      "title": "Tiêu đề H2",
      "content": "Nội dung phần này với <strong>, <em>, <ul><li>..."
    },
    {
      "type": "infobox",
      "variant": "success|warning|default",
      "icon": "fas fa-icon",
      "title": "Tiêu đề box",
      "content": "Nội dung info box..."
    },
    {
      "type": "table",
      "headers": ["Cột 1", "Cột 2"],
      "rows": [["Dữ liệu 1", "Dữ liệu 2"]]
    }
  ],
  "relatedSlugs": ["slug-bai-1", "slug-bai-2"],
  "relatedTitles": ["Tiêu đề bài 1", "Tiêu đề bài 2"],
  "relatedIcons": ["fas fa-icon1", "fas fa-icon2"]
}

YÊU CẦU NỘI DUNG:
- Viết ít nhất 6-8 sections
- Có CTA quảng cáo sản phẩm tự nhiên trong bài
- Keywords SEO tự nhiên, không nhồi nhét
- Giọng văn thân thiện, chuyên gia
- PHẢI có ít nhất 1 bảng so sánh
- Có info-box tips hoặc warning
- QUAN TRỌNG: Trong nội dung bài viết, hãy chèn 2-3 internal link đến các bài viết liên quan đã có trên website, dùng thẻ <a href="ten-bai.html">tiêu đề bài</a>. Các bài đã có: ${(state.knownSlugs || DEFAULT_SLUGS).join(', ')}
- relatedSlugs CHỈ được chọn trong danh sách bài đã có ở trên
- CHỈ trả về JSON, không có text khác`;
}

async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent?key=${state.geminiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 8000 }
        })
    });
    if (!res.ok) throw new Error('Gemini API lỗi: ' + res.status);
    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text;
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ');
    return JSON.parse(jsonMatch[0]);
}

// ============ PREVIEW ============
function renderPreview(data) {
    const body = document.getElementById('previewBody');
    const url = document.getElementById('previewUrl');
    data.slug = createSlug(data.slug || data.title);
    url.textContent = `${CONFIG.SITE_URL.replace('https://', '')}/blog/${data.slug}.html`;
    state.articleSlug = data.slug;
    state.articleTitle = data.title;

    let html = `<h1><i class="${data.icon}"></i> ${data.title}</h1>`;
    html += `<p style="color:var(--admin-muted);font-size:.8rem;margin-bottom:16px;"><i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('vi-VN')} &nbsp;|&nbsp; <i class="far fa-clock"></i> ${data.readTime}</p>`;

    for (const s of data.sections) {
        switch (s.type) {
            case 'intro':
                html += `<p>${s.content}</p>`;
                break;
            case 'heading':
                html += `<h2><i class="${s.icon}"></i> ${s.title}</h2><div>${s.content}</div>`;
                break;
            case 'infobox':
                html += `<div style="background:var(--admin-input-bg);border-left:3px solid var(--admin-accent);padding:12px 16px;border-radius:8px;margin:12px 0;"><h4><i class="${s.icon}"></i> ${s.title}</h4><p>${s.content}</p></div>`;
                break;
            case 'table':
                html += '<table><thead><tr>';
                s.headers.forEach(h => html += `<th>${h}</th>`);
                html += '</tr></thead><tbody>';
                s.rows.forEach(r => { html += '<tr>'; r.forEach(c => html += `<td>${c}</td>`); html += '</tr>'; });
                html += '</tbody></table>';
                break;
        }
    }
    body.innerHTML = html;
    state.generatedHTML = buildMarkdown(data);
}

function showPreviewLoading() {
    document.getElementById('previewBody').innerHTML = '<div class="generating-anim"><span class="loading-spinner"></span> AI đang viết bài...</div>';
}
function showPreviewPlaceholder() {
    document.getElementById('previewBody').innerHTML = '<div class="placeholder"><i class="fas fa-newspaper"></i><p>Nhập chủ đề và nhấn "Tạo Bài Viết"<br>để xem preview tại đây</p></div>';
}

// ============ BUILD MARKDOWN (nguon Astro) ============
// Danh sach bai mac dinh khi chua tai duoc tu GitHub (dung trong prompt cho AI)
const DEFAULT_SLUGS = ['cach-lam-tuong-ot-tai-nha', 'tac-dung-tac-hai-cua-ot', 'cac-loai-ot-cay-nhat-the-gioi', 'cac-loai-ot-lam-tuong-ot', 'cach-bao-quan-tuong-ot', 'mon-an-khong-the-thieu-tuong-ot', 'phan-biet-tuong-ot-cong-nghiep-va-thu-cong', 'lich-su-ot-tu-mexico-den-vn', '7-nhom-nguoi-khong-nen-an-ot', 'an-ot-co-giup-giam-can-khong'];

function buildMarkdown(data) {
    const todayISO = new Date().toISOString().split('T')[0];
    const grad = data.headerGradient || 'rgba(220,53,69,0.2) 0%, rgba(255,107,107,0.1) 100%';
    const q = (s) => JSON.stringify(String(s ?? '')); // chuoi JSON cung la YAML hop le

    let body = '';
    for (const s of data.sections) {
        switch (s.type) {
            case 'intro':
                body += `<p>${s.content}</p>\n`;
                break;
            case 'heading':
                body += `<h2><i class="${s.icon}"></i> ${s.title}</h2>\n<div>${s.content}</div>\n`;
                break;
            case 'infobox': {
                const v = s.variant || 'default';
                const cls = v === 'default' ? 'info-box' : `info-box ${v}`;
                body += `<div class="${cls}">\n<h4><i class="${s.icon}"></i> ${s.title}</h4>\n<p>${s.content}</p>\n</div>\n`;
                break;
            }
            case 'table':
                body += '<table class="article-table"><thead><tr>';
                s.headers.forEach(h => body += `<th>${h}</th>`);
                body += '</tr></thead><tbody>';
                s.rows.forEach(r => { body += '<tr>'; r.forEach(c => body += `<td>${c}</td>`); body += '</tr>'; });
                body += '</tbody></table>\n';
                break;
        }
    }
    // Bo dong trong + thut dau dong: de Markdown giu nguyen khoi HTML, khong bien thanh "code"
    body = body.split('\n').map(l => l.trim()).filter(Boolean).join('\n');

    const fm = [
        '---',
        `title: ${q(data.title + ' | Blog ' + CONFIG.BRAND)}`,
        `description: ${q(data.metaDescription)}`,
        `keywords: ${q(data.keywords)}`,
        `heading: ${q(data.title)}`,
        `headingIcon: ${q(data.icon || 'fas fa-pepper-hot')}`,
        `date: ${q(todayISO)}`,
        `readTime: ${parseInt(data.readTime, 10) || 5}`,
        `headerStyle: ${q(`background:linear-gradient(135deg,${grad});`)}`,
    ];
    const related = (data.relatedSlugs || []).map((slug, i) => ({
        slug: createSlug(slug), icon: data.relatedIcons?.[i] || 'fas fa-newspaper', title: data.relatedTitles?.[i] || slug,
    }));
    if (related.length) {
        fm.push('related:');
        related.forEach(r => fm.push(`  - slug: ${q(r.slug)}`, `    icon: ${q(r.icon)}`, `    title: ${q(r.title)}`));
    }
    fm.push('card:', `  category: "Blog"`, `  bg: ${q(`background: linear-gradient(135deg, ${grad});`)}`, '---');
    return fm.join('\n') + '\n' + body + '\n';
}

// ============ PUBLISH TO GITHUB ============
async function publishArticle() {
    if (!state.githubToken) return showToast('Cần GitHub Token!', 'error');
    if (!state.generatedHTML) return showToast('Chưa có bài viết để publish!', 'error');

    const btn = document.getElementById('btnPublish');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Đang publish...';
    addLog('Bắt đầu publish lên GitHub...');

    try {
        const filePath = `${CONFIG.POSTS_PATH}/${state.articleSlug}.md`;
        // Khong ghi de bai cu trung ten
        const exists = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${filePath}`,
            { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (exists.ok) throw new Error(`Đã có bài trùng địa chỉ "${state.articleSlug}". Đổi chủ đề hoặc sửa bài cũ ở tab Bài viết.`);

        await githubCreateFile(filePath, state.generatedHTML, `Thêm bài viết: ${state.articleTitle}`);
        addLog(`✅ Đã tạo file: ${filePath}`);
        addLog('⏳ GitHub đang tự build blog, thêm vào trang danh sách + sitemap rồi đưa lên web (~3-5 phút)');

        showToast('🎉 Đã gửi bài! Bài sẽ lên web sau khoảng 3-5 phút.', 'success');
        addLog(`🔗 URL: ${CONFIG.SITE_URL}/blog/${state.articleSlug}.html`);
    } catch (err) {
        showToast('Lỗi publish: ' + err.message, 'error');
        addLog('❌ LỖI: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Publish lên GitHub';
    }
}

async function githubCreateFile(path, content, message) {
    const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${path}`;

    // Check if file exists
    let sha = null;
    try {
        const check = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (check.ok) {
            const existing = await check.json();
            sha = existing.sha;
        }
    } catch (e) { /* file doesn't exist */ }

    const body = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main'
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.githubToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'GitHub API error');
    }
    return res.json();
}

// ============ UTILS ============
function createSlug(text) {
    const map = { 'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a', 'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a', 'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a', 'đ': 'd', 'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e', 'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e', 'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i', 'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o', 'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o', 'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u', 'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u', 'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y' };
    return text.toLowerCase().replace(/[^\w\s-]/g, c => map[c] || '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function addLog(msg) {
    const panel = document.getElementById('logPanel');
    const time = new Date().toLocaleTimeString('vi-VN');
    panel.innerHTML = `<div class="log-entry"><span class="log-time">${time}</span><span>${msg}</span></div>` + panel.innerHTML;
}

// ============ TABS ============
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    document.getElementById('content' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');

    if (tab === 'articles') refreshArticleList();
    if (tab === 'planner') renderPlanList();
    if (tab === 'gallery') refreshGalleryList();
    if (tab === 'products') loadProducts();
}

// ============ ARTICLE LIST ============
// Doc danh sach bai tu thu muc nguon Astro tren GitHub, lay tieu de tu dong "heading:" trong moi file
async function refreshArticleList() {
    const list = document.getElementById('articleList');
    if (!state.githubToken) {
        list.innerHTML = '<div class="placeholder"><i class="fas fa-key"></i><p>Cấu hình GitHub Token để xem danh sách bài.</p></div>';
        return;
    }
    list.innerHTML = '<div class="placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';

    let articles = [];
    try {
        const headers = { 'Authorization': `token ${state.githubToken}` };
        const res = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.POSTS_PATH}`, { headers });
        if (!res.ok) throw new Error('Không đọc được thư mục bài viết: ' + res.status);
        const files = (await res.json()).filter(f => f.name.endsWith('.md'));
        articles = await Promise.all(files.map(async f => {
            const slug = f.name.replace(/\.md$/, '');
            let title = slug, icon = 'fas fa-file-alt';
            try {
                const r = await fetch(f.download_url, { headers });
                const text = await r.text();
                title = JSON.parse(text.match(/^heading:\s*(".*")\s*$/m)?.[1] || JSON.stringify(slug));
                icon = JSON.parse(text.match(/^headingIcon:\s*(".*")\s*$/m)?.[1] || JSON.stringify(icon));
            } catch (e) { /* giu ten file */ }
            return { slug, title, icon };
        }));
        state.knownSlugs = articles.map(a => a.slug);
    } catch (e) {
        list.innerHTML = `<div class="placeholder"><i class="fas fa-exclamation-triangle"></i><p>${e.message}</p></div>`;
        return;
    }

    document.getElementById('articleCount').textContent = articles.length;

    if (!articles.length) {
        list.innerHTML = '<div class="placeholder"><i class="fas fa-inbox"></i><p>Chưa có bài viết nào</p></div>';
        return;
    }

    list.innerHTML = articles.map(a => `
        <div class="article-item">
            <div class="article-icon"><i class="${escHtml(a.icon)}"></i></div>
            <div class="article-info">
                <h4>${escHtml(a.title)}</h4>
                <span>${a.slug}.md</span>
            </div>
            <div class="article-actions">
                <a href="${CONFIG.SITE_URL}/blog/${a.slug}.html" target="_blank" title="Xem bài viết"><i class="fas fa-external-link-alt"></i></a>
                <button onclick="openEditor('${a.slug}')" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                <button onclick="useTopic('${a.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" title="Tạo bài tương tự"><i class="fas fa-copy"></i></button>
            </div>
        </div>
    `).join('');
}

// ============ TOPIC PLANNER ============
function getPlan() {
    try { return JSON.parse(localStorage.getItem('blogPlan') || '[]'); } catch { return []; }
}
function savePlan(plan) {
    localStorage.setItem('blogPlan', JSON.stringify(plan));
    document.getElementById('planCount').textContent = plan.filter(p => !p.done).length;
}

function addPlanTopic() {
    const title = document.getElementById('planTitle').value.trim();
    if (!title) return showToast('Nhập tiêu đề chủ đề!', 'error');
    const note = document.getElementById('planNote').value.trim();
    const priority = document.getElementById('planPriority').value;

    const plan = getPlan();
    plan.unshift({
        id: Date.now(),
        title,
        note,
        priority,
        done: false,
        createdAt: new Date().toLocaleDateString('vi-VN')
    });
    savePlan(plan);
    document.getElementById('planTitle').value = '';
    document.getElementById('planNote').value = '';
    renderPlanList();
    showToast('Đã thêm chủ đề vào kế hoạch!', 'success');
}

function togglePlanDone(id) {
    const plan = getPlan();
    const item = plan.find(p => p.id === id);
    if (item) item.done = !item.done;
    savePlan(plan);
    renderPlanList();
}

function deletePlanItem(id) {
    const plan = getPlan().filter(p => p.id !== id);
    savePlan(plan);
    renderPlanList();
    showToast('Đã xóa chủ đề', 'info');
}

function useTopic(title) {
    switchTab('create');
    document.getElementById('topic').value = title;
    document.getElementById('topic').focus();
    showToast('Đã điền chủ đề, nhấn "Tạo Bài Viết" để bắt đầu!', 'info');
}

let currentFilter = 'all';
function filterPlan(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderPlanList();
}

function renderPlanList() {
    const list = document.getElementById('planList');
    let plan = getPlan();
    document.getElementById('planCount').textContent = plan.filter(p => !p.done).length;

    if (currentFilter === 'pending') plan = plan.filter(p => !p.done);
    if (currentFilter === 'done') plan = plan.filter(p => p.done);

    if (!plan.length) {
        list.innerHTML = '<div class="placeholder" style="min-height:150px;"><i class="fas fa-clipboard-list"></i><p>Chưa có chủ đề nào.<br>Dùng AI gợi ý hoặc thêm thủ công.</p></div>';
        return;
    }

    const priorityLabel = { high: '🔴 Cao', medium: '🟡 TB', low: '🟢 Thấp' };
    list.innerHTML = plan.map(p => `
        <div class="plan-item ${p.done ? 'done' : ''}">
            <button class="plan-check ${p.done ? 'checked' : ''}" onclick="togglePlanDone(${p.id})">${p.done ? '✓' : ''}</button>
            <div class="plan-body">
                <div class="plan-title">${p.title}</div>
                ${p.note ? `<div class="plan-note">${p.note}</div>` : ''}
                <div class="plan-meta">
                    <span class="priority-badge ${p.priority}">${priorityLabel[p.priority] || p.priority}</span>
                    <span class="plan-date"><i class="far fa-calendar"></i> ${p.createdAt}</span>
                </div>
            </div>
            <div class="plan-actions">
                <button onclick="useTopic('${p.title.replace(/'/g, "\\'")}')" title="Viết bài này"><i class="fas fa-pen"></i></button>
                <button class="delete" onclick="deletePlanItem(${p.id})" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

function clearAllPlan() {
    if (!confirm('Xóa tất cả kế hoạch chủ đề?')) return;
    savePlan([]);
    renderPlanList();
    showToast('Đã xóa tất cả', 'info');
}

function exportPlan() {
    const plan = getPlan();
    if (!plan.length) return showToast('Chưa có gì để xuất!', 'error');
    const text = plan.map((p, i) => `${i + 1}. [${p.done ? 'x' : ' '}] ${p.title}${p.note ? ' - ' + p.note : ''} (${p.priority})`).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('Đã copy kế hoạch!', 'success'));
}

// ============ AI SUGGEST TOPICS ============
async function aiSuggestTopics() {
    if (!state.geminiKey) return showToast('Cần Gemini API Key!', 'error');

    const btn = document.getElementById('btnSuggest');
    const count = document.getElementById('suggestCount').value;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> AI đang suy nghĩ...';
    document.getElementById('suggestResult').innerHTML = '<div class="generating-anim"><span class="loading-spinner"></span> Đang phân tích và gợi ý...</div>';

    const existingTitles = (state.knownSlugs || DEFAULT_SLUGS).map(s => s.replace(/-/g, ' ')).join(', ');
    const planTitles = getPlan().map(p => p.title).join(', ');

    const prompt = `Bạn là chuyên gia SEO và content marketing cho website bán tương ớt "Tương Ớt Siêu Cay Bông Ớt".
Sản phẩm: tương ớt nguyên chất 100% từ ớt tươi, không chất bảo quản.

Các bài đã viết: ${existingTitles}
${planTitles ? 'Các chủ đề đang lên kế hoạch: ' + planTitles : ''}

Hãy gợi ý ${count} chủ đề bài viết MỚI, KHÔNG trùng với các bài đã có.
Yêu cầu:
- Phù hợp SEO, có tiềm năng traffic
- Liên quan đến ớt, tương ớt, ẩm thực, sức khỏe
- Có thể lồng ghép quảng bá sản phẩm tự nhiên
- Đa dạng chủ đề (sức khỏe, công thức, kiến thức, mẹo vặt, so sánh...)

Trả về JSON array CHÍNH XÁC format:
[{"title":"Tiêu đề bài viết","note":"Mô tả ngắn về nội dung, keywords chính","priority":"high|medium|low"}]
CHỈ trả về JSON, không có text khác.`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent?key=${state.geminiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 4000 }
            })
        });
        if (!res.ok) throw new Error('API lỗi: ' + res.status);
        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('AI không trả về danh sách hợp lệ');
        const suggestions = JSON.parse(jsonMatch[0]);
        renderSuggestions(suggestions);
        showToast(`AI đã gợi ý ${suggestions.length} chủ đề!`, 'success');
    } catch (err) {
        document.getElementById('suggestResult').innerHTML = `<p style="color:var(--admin-danger);font-size:.85rem;">Lỗi: ${err.message}</p>`;
        showToast('Lỗi gợi ý: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lightbulb"></i> Gợi Ý Chủ Đề Mới';
    }
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestResult');
    const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
    container.innerHTML = `<div class="suggest-list">${suggestions.map((s, i) => `
        <div class="suggest-item">
            <span>${priorityEmoji[s.priority] || '🟡'} <strong>${s.title}</strong><br><small style="color:var(--admin-muted);">${s.note || ''}</small></span>
            <button onclick="addSuggestionToPlan(${i})" title="Thêm vào kế hoạch"><i class="fas fa-plus"></i> Lưu</button>
            <button class="use-btn" onclick="useTopic('${s.title.replace(/'/g, "\\'")}')" title="Viết ngay"><i class="fas fa-pen"></i> Viết</button>
        </div>
    `).join('')}</div>
    <button class="btn-admin btn-outline" style="margin-top:10px;" onclick="addAllSuggestionsToPlan()"><i class="fas fa-plus-circle"></i> Lưu tất cả vào kế hoạch</button>`;

    // Store for later use
    window._lastSuggestions = suggestions;
}

function addSuggestionToPlan(index) {
    const s = window._lastSuggestions?.[index];
    if (!s) return;
    const plan = getPlan();
    if (plan.some(p => p.title === s.title)) return showToast('Chủ đề này đã có trong kế hoạch!', 'info');
    plan.unshift({ id: Date.now() + index, title: s.title, note: s.note || '', priority: s.priority || 'medium', done: false, createdAt: new Date().toLocaleDateString('vi-VN') });
    savePlan(plan);
    showToast('Đã thêm: ' + s.title, 'success');
}

function addAllSuggestionsToPlan() {
    const suggestions = window._lastSuggestions;
    if (!suggestions?.length) return;
    const plan = getPlan();
    const existingTitles = new Set(plan.map(p => p.title));
    let added = 0;
    suggestions.forEach((s, i) => {
        if (!existingTitles.has(s.title)) {
            plan.unshift({ id: Date.now() + i, title: s.title, note: s.note || '', priority: s.priority || 'medium', done: false, createdAt: new Date().toLocaleDateString('vi-VN') });
            added++;
        }
    });
    savePlan(plan);
    renderPlanList();
    showToast(`Đã thêm ${added} chủ đề vào kế hoạch!`, 'success');
}

// Init tabs on load
document.addEventListener('DOMContentLoaded', () => {
    renderPlanList();
    loadPlanFromCloud(); // sync from GitHub on load
});

// ============ ARTICLE EDITOR ============
let editorState = { slug: '', sha: '', originalContent: '' };

async function openEditor(slug) {
    if (!state.githubToken) return showToast('Cần GitHub Token để chỉnh sửa!', 'error');

    const modal = document.getElementById('editorModal');
    const textarea = document.getElementById('editorContent');
    const fileName = document.getElementById('editorFileName');
    const status = document.getElementById('editorStatus');

    modal.style.display = 'flex';
    textarea.value = 'Đang tải nội dung...';
    fileName.textContent = slug + '.md';
    status.textContent = 'Đang tải...';

    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.POSTS_PATH}/${slug}.md`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (!res.ok) throw new Error('Không tải được file: ' + res.status);

        const data = await res.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        editorState = { slug, sha: data.sha, originalContent: content };

        textarea.value = content;
        status.textContent = `${content.length} ký tự | SHA: ${data.sha.substring(0, 7)}`;
        showToast('Đã tải nội dung bài viết', 'success');
    } catch (err) {
        textarea.value = 'LỖI: ' + err.message;
        status.textContent = 'Lỗi tải file';
        showToast('Lỗi: ' + err.message, 'error');
    }
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
}

async function saveEditedArticle() {
    if (!state.githubToken) return showToast('Cần GitHub Token!', 'error');

    const content = document.getElementById('editorContent').value;
    if (content === editorState.originalContent) return showToast('Không có thay đổi nào!', 'info');

    const btn = document.getElementById('btnSaveEdit');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Đang lưu...';
    document.getElementById('editorStatus').textContent = 'Đang push lên GitHub...';

    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.POSTS_PATH}/${editorState.slug}.md`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${state.githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Chỉnh sửa: ${editorState.slug}.md`,
                content: btoa(unescape(encodeURIComponent(content))),
                sha: editorState.sha,
                branch: 'main'
            })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
        const result = await res.json();
        editorState.sha = result.content.sha;
        editorState.originalContent = content;
        document.getElementById('editorStatus').textContent = `✅ Đã lưu | SHA: ${result.content.sha.substring(0, 7)}`;
        showToast('🎉 Đã lưu! GitHub tự build, thay đổi lên web sau khoảng 3-5 phút.', 'success');
    } catch (err) {
        document.getElementById('editorStatus').textContent = '❌ Lỗi lưu';
        showToast('Lỗi: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Lưu & Push lên GitHub';
    }
}

// ============ CLOUD PLAN STORAGE (GitHub) ============
const PLAN_FILE = 'blog/plan.json';

async function savePlanToCloud() {
    if (!state.githubToken) return; // silent fail if no token
    const plan = getPlan();
    try {
        await githubCreateFile(PLAN_FILE, JSON.stringify(plan, null, 2), 'Cập nhật kế hoạch blog');
    } catch (e) { /* silent */ }
}

async function loadPlanFromCloud() {
    if (!state.githubToken) return;
    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${PLAN_FILE}`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (!res.ok) return; // file doesn't exist yet
        const data = await res.json();
        const cloudPlan = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        const localPlan = getPlan();

        // Merge: cloud items win, add new local items
        const cloudIds = new Set(cloudPlan.map(p => p.id));
        const merged = [...cloudPlan];
        localPlan.forEach(p => { if (!cloudIds.has(p.id)) merged.push(p); });

        localStorage.setItem('blogPlan', JSON.stringify(merged));
        renderPlanList();
    } catch (e) { /* use local */ }
}

// Override savePlan to also sync to cloud
const _originalSavePlan = savePlan;
savePlan = function (plan) {
    localStorage.setItem('blogPlan', JSON.stringify(plan));
    document.getElementById('planCount').textContent = plan.filter(p => !p.done).length;
    savePlanToCloud(); // async cloud sync
};

// ============ GALLERY MANAGEMENT ============
let uploadQueue = [];

// Dropzone events
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('galleryDropzone');
    const fileInput = document.getElementById('galleryFileInput');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', e => { handleFiles(e.target.files); e.target.value = ''; });
});

function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) { showToast(`${file.name} không phải ảnh`, 'error'); continue; }
        if (file.size > 5 * 1024 * 1024) { showToast(`${file.name} quá lớn (max 5MB)`, 'error'); continue; }

        const reader = new FileReader();
        reader.onload = e => {
            uploadQueue.push({
                id: Date.now() + Math.random(),
                file,
                name: file.name,
                size: file.size,
                preview: e.target.result,
                base64: e.target.result.split(',')[1], // raw base64 data
                status: 'pending'
            });
            renderUploadQueue();
        };
        reader.readAsDataURL(file);
    }
}

function renderUploadQueue() {
    const container = document.getElementById('uploadQueue');
    const card = document.getElementById('uploadQueueCard');
    const count = document.getElementById('uploadQueueCount');
    if (!container) return;

    card.style.display = uploadQueue.length ? '' : 'none';
    count.textContent = uploadQueue.length;

    container.innerHTML = uploadQueue.map((item, i) => `
        <div class="upload-queue-item" id="uqi-${item.id}">
            <img src="${item.preview}" alt="${item.name}">
            <div class="info">
                <div class="name">${item.name}</div>
                <div class="size">${(item.size / 1024).toFixed(0)} KB</div>
            </div>
            <span class="status-icon ${item.status}">
                ${item.status === 'pending' ? '<i class="fas fa-clock"></i>' :
            item.status === 'uploading' ? '<i class="fas fa-spinner fa-spin"></i>' :
                item.status === 'done' ? '<i class="fas fa-check"></i>' :
                    '<i class="fas fa-times"></i>'}
            </span>
            ${item.status === 'pending' ? `<button class="remove-btn" onclick="removeFromQueue(${i})"><i class="fas fa-times"></i></button>` : ''}
        </div>
    `).join('');
}

function removeFromQueue(index) {
    uploadQueue.splice(index, 1);
    renderUploadQueue();
}

function clearUploadQueue() {
    uploadQueue = uploadQueue.filter(item => item.status !== 'pending');
    renderUploadQueue();
}

async function uploadAllImages() {
    if (!state.githubToken) { showToast('Chưa cấu hình GitHub Token!', 'error'); return; }
    const pending = uploadQueue.filter(item => item.status === 'pending');
    if (!pending.length) { showToast('Không có ảnh mới để upload', 'error'); return; }

    const btn = document.getElementById('btnUploadAll');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang upload...';
    const category = document.getElementById('galleryCategory').value;
    const categoryLabels = { products: 'Sản phẩm', food: 'Món ăn', process: 'Quy trình' };

    let successCount = 0;
    const newEntries = [];

    for (const item of pending) {
        item.status = 'uploading';
        renderUploadQueue();

        try {
            const path = `images/gallery/${item.name}`;
            await githubUploadBinary(path, item.base64, `📸 Upload ảnh gallery: ${item.name}`);

            // Collect info for gallery.html update
            newEntries.push({
                filename: item.name,
                category,
                categoryLabel: categoryLabels[category],
                alt: `Tương ớt Bông Ớt - ${item.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`
            });

            item.status = 'done';
            successCount++;
        } catch (err) {
            item.status = 'error';
            console.error(`Upload failed: ${item.name}`, err);
        }
        renderUploadQueue();
    }

    // Update gallery.html with new entries
    if (newEntries.length > 0) {
        try {
            await updateGalleryHTML(newEntries);
            showToast(`✅ Upload ${successCount} ảnh + cập nhật gallery.html`, 'success');
        } catch (err) {
            showToast(`Upload ${successCount} ảnh OK, nhưng lỗi cập nhật gallery.html: ${err.message}`, 'error');
        }
    } else {
        showToast('Không upload được ảnh nào', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-rocket"></i> Upload Tất Cả Lên GitHub';

    // Remove done items after 2s
    setTimeout(() => {
        uploadQueue = uploadQueue.filter(item => item.status !== 'done');
        renderUploadQueue();
        refreshGalleryList();
    }, 2000);
}

// Upload binary file to GitHub
async function githubUploadBinary(path, base64Data, message) {
    const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${path}`;

    // Check if exists
    let sha = null;
    try {
        const check = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (check.ok) { sha = (await check.json()).sha; }
    } catch (e) { }

    const body = { message, content: base64Data, branch: 'main' };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${state.githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'GitHub API error'); }
    return res.json();
}

// Update gallery.html with new image entries
async function updateGalleryHTML(newEntries) {
    const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/gallery.html`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
    if (!res.ok) throw new Error('Không tìm thấy gallery.html');

    const data = await res.json();
    let content = decodeURIComponent(escape(atob(data.content)));

    // Build new HTML entries
    const newHTML = newEntries.map(entry => `
            <div class="gallery-item" data-category="${entry.category}">
                <img src="images/gallery/${entry.filename}" alt="${entry.alt}" loading="lazy">
                <div class="overlay">
                    <h4>${entry.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}</h4>
                    <span>${entry.categoryLabel}</span>
                </div>
            </div>`).join('\n');

    // Chen ngay truoc the dong cua luoi anh: "</div>" (galleryGrid) + "</div>" (container) + <!-- CTA ...
    // Khong co cach chen "du phong": tim sai cho thi dung lai, khong lam vo trang that.
    const m = content.match(/\n[ \t]*<\/div>\s*\n[ \t]*<\/div>\s*\n\s*<!-- CTA/);
    if (!m || m.index < content.indexOf('id="galleryGrid"')) {
        throw new Error('Không tìm được vị trí chèn trong gallery.html (cấu trúc trang đã đổi). Chưa sửa gì.');
    }
    content = content.slice(0, m.index) + '\n' + newHTML + content.slice(m.index);

    // Push updated file
    await githubCreateFile('gallery.html', content, `📸 Thêm ${newEntries.length} ảnh vào gallery`);
}

// Load existing gallery images from GitHub
async function refreshGalleryList() {
    const grid = document.getElementById('galleryAdminGrid');
    const countEl = document.getElementById('galleryImageCount');
    if (!grid) return;

    if (!state.githubToken) {
        grid.innerHTML = '<div class="placeholder"><i class="fas fa-key"></i><p>Cấu hình GitHub Token trước.</p></div>';
        return;
    }

    grid.innerHTML = '<div class="placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';

    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/images/gallery`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (!res.ok) throw new Error('Không tải được danh sách ảnh');

        const files = await res.json();
        const images = files.filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name));

        countEl.textContent = images.length;

        if (!images.length) {
            grid.innerHTML = '<div class="placeholder"><i class="fas fa-images"></i><p>Chưa có ảnh nào trong gallery.</p></div>';
            return;
        }

        grid.innerHTML = images.map(img => `
            <div class="gallery-admin-item">
                <img src="${CONFIG.SITE_URL}/images/gallery/${img.name}" alt="${img.name}" loading="lazy">
                <div class="item-name">${img.name}</div>
                <button class="delete-btn" onclick="deleteGalleryImage('${img.name}', '${img.sha}')" title="Xóa ảnh">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `<div class="placeholder"><i class="fas fa-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

async function deleteGalleryImage(name, sha) {
    if (!confirm(`Xóa ảnh "${name}" khỏi GitHub?`)) return;

    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/images/gallery/${name}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${state.githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `🗑️ Xóa ảnh gallery: ${name}`, sha, branch: 'main' })
        });
        if (!res.ok) throw new Error('Lỗi xóa ảnh');
        showToast(`Đã xóa ${name}`, 'success');
        refreshGalleryList();
    } catch (err) {
        showToast(`Lỗi: ${err.message}`, 'error');
    }
}

// ============ PRODUCT MANAGEMENT ============
let productList = [];
let indexHtmlSha = null;
let indexHtmlContent = '';

const BOTTLE_COLORS = [
    { value: 'red', label: '🔴 Đỏ (Siêu Cay)' },
    { value: 'green', label: '🟢 Xanh (Truyền Thống)' },
    { value: 'orange', label: '🟠 Cam (Bán Buôn)' },
    { value: 'yellow', label: '🟡 Vàng' },
    { value: 'purple', label: '🟣 Tím' },
];

async function loadProducts() {
    const list = document.getElementById('productEditorList');
    if (!state.githubToken) { list.innerHTML = '<div class="placeholder"><i class="fas fa-key"></i><p>Cấu hình GitHub Token trước.</p></div>'; return; }

    list.innerHTML = '<div class="placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';

    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/index.html`;
        const res = await fetch(url, { headers: { 'Authorization': `token ${state.githubToken}` } });
        if (!res.ok) throw new Error('Không tải được index.html');
        const data = await res.json();
        indexHtmlSha = data.sha;
        indexHtmlContent = decodeURIComponent(escape(atob(data.content)));

        // Parse products from HTML
        productList = parseProducts(indexHtmlContent);
        renderProductEditor();
        document.getElementById('btnSaveProducts').disabled = false;
        showToast(`Đã tải ${productList.length} sản phẩm`, 'info');
    } catch (err) {
        list.innerHTML = `<div class="placeholder"><i class="fas fa-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

function parseProducts(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = doc.querySelectorAll('.products-grid .product-card');
    const products = [];

    cards.forEach(card => {
        const name = card.querySelector('.product-name')?.textContent?.trim() || '';
        const desc = card.querySelector('.product-description')?.textContent?.trim() || '';
        const priceOrig = card.querySelector('.price-original')?.textContent?.trim() || '';
        const priceSale = card.querySelector('.price-sale')?.textContent?.trim() || '';
        const priceUnit = card.querySelector('.price-unit')?.textContent?.trim() || '';
        const badge = card.querySelector('.product-badge')?.textContent?.trim() || '';
        const labelHeader = card.querySelector('.label-header')?.textContent?.trim() || '';
        const labelText = card.querySelector('.label-text')?.textContent?.trim() || '';
        const isFeatured = card.classList.contains('featured');
        const isWholesale = card.classList.contains('wholesale');

        // Get bottle color
        const bottleEl = card.querySelector('[class*="product-bottle-small"]');
        let color = 'red';
        if (bottleEl) {
            const classes = bottleEl.className;
            BOTTLE_COLORS.forEach(c => { if (classes.includes(c.value)) color = c.value; });
        }

        // Get spicy level (count pepper icons)
        const peppers = card.querySelectorAll('.spicy-level .fa-pepper-hot').length;

        products.push({
            name, desc, priceOrig, priceSale, priceUnit, badge, labelHeader, labelText,
            color, peppers: peppers || 3, isFeatured, isWholesale
        });
    });

    return products;
}

function renderProductEditor() {
    const list = document.getElementById('productEditorList');
    if (!productList.length) {
        list.innerHTML = '<div class="placeholder"><i class="fas fa-box-open"></i><p>Chưa có sản phẩm. Nhấn "Thêm sản phẩm".</p></div>';
        return;
    }

    list.innerHTML = productList.map((p, i) => `
        <div class="product-editor-item" style="background:var(--admin-input-bg);border:1px solid var(--admin-border);border-radius:12px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <strong style="color:var(--admin-accent);"><i class="fas fa-box"></i> Sản phẩm ${i + 1}</strong>
                <button class="btn-admin btn-outline btn-sm" onclick="removeProduct(${i})" style="color:var(--admin-danger);border-color:var(--admin-danger);width:auto;">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group" style="grid-column:1/-1;">
                    <label>Tên sản phẩm *</label>
                    <input type="text" value="${escHtml(p.name)}" onchange="productList[${i}].name=this.value">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>Mô tả</label>
                    <textarea rows="2" onchange="productList[${i}].desc=this.value">${escHtml(p.desc)}</textarea>
                </div>
                <div class="form-group">
                    <label>Giá gốc <small>(khoá)</small></label>
                    <input type="text" value="${escHtml(p.priceOrig)}" readonly title="Đổi giá phải sửa functions/catalog.js">
                </div>
                <div class="form-group">
                    <label>Giá bán <small>(khoá)</small></label>
                    <input type="text" value="${escHtml(p.priceSale)}" readonly title="Đổi giá phải sửa functions/catalog.js">
                </div>
                <div class="form-group">
                    <label>Badge (VD: Bán Chạy Nhất)</label>
                    <input type="text" value="${escHtml(p.badge)}" onchange="productList[${i}].badge=this.value" placeholder="Để trống nếu không cần">
                </div>
                <div class="form-group">
                    <label>Màu chai</label>
                    <select onchange="productList[${i}].color=this.value">
                        ${BOTTLE_COLORS.map(c => `<option value="${c.value}" ${p.color === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Nhãn chai trên (VD: EXTRA HOT)</label>
                    <input type="text" value="${escHtml(p.labelHeader)}" onchange="productList[${i}].labelHeader=this.value">
                </div>
                <div class="form-group">
                    <label>Nhãn chai dưới (VD: SIÊU CAY)</label>
                    <input type="text" value="${escHtml(p.labelText)}" onchange="productList[${i}].labelText=this.value">
                </div>
                <div class="form-group">
                    <label>Độ cay (1-5 ớt)</label>
                    <select onchange="productList[${i}].peppers=+this.value">
                        ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${p.peppers === n ? 'selected' : ''}>🌶️ × ${n}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Kiểu</label>
                    <select onchange="productList[${i}].isFeatured=this.value==='featured';productList[${i}].isWholesale=this.value==='wholesale';">
                        <option value="normal" ${!p.isFeatured && !p.isWholesale ? 'selected' : ''}>Thường</option>
                        <option value="featured" ${p.isFeatured ? 'selected' : ''}>⭐ Nổi bật (viền nổi)</option>
                        <option value="wholesale" ${p.isWholesale ? 'selected' : ''}>📦 Bán buôn</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addNewProduct() {
    // San pham moi phai co trong functions/catalog.js + app.html thi moi dat hang duoc
    return showToast(PRICE_LOCK_MSG, 'error');
    if (productList.length >= 6) { showToast('Tối đa 6 sản phẩm!', 'error'); return; }
    productList.push({
        name: 'Sản Phẩm Mới',
        desc: 'Mô tả sản phẩm',
        priceOrig: '₫50,000',
        priceSale: '₫45,000',
        badge: '',
        labelHeader: 'HOT',
        labelText: 'MỚI',
        color: 'red',
        peppers: 3,
        isFeatured: false,
        isWholesale: false
    });
    renderProductEditor();
    showToast('Đã thêm sản phẩm mới', 'info');
}

function removeProduct(index) {
    return showToast(PRICE_LOCK_MSG, 'error');
    if (!confirm(`Xóa sản phẩm "${productList[index].name}"?`)) return;
    productList.splice(index, 1);
    renderProductEditor();
    showToast('Đã xóa sản phẩm', 'info');
}

// Gia + danh sach san pham bi khoa: gia tinh tien that nam o functions/catalog.js (server),
// app.html va index.html chi hien thi. Doi o day ma khong doi catalog = khach thay mot gia, bi tinh gia khac.
const PRICE_LOCK_MSG = 'Giá và danh sách sản phẩm đang khoá: giá tính tiền thật nằm ở functions/catalog.js. Muốn đổi giá/thêm sản phẩm phải sửa catalog + app.html + trang chủ cùng lúc.';

function buildProductsHTML(products) {
    return products.map(p => {
        const cardClass = p.isFeatured ? 'product-card featured' : p.isWholesale ? 'product-card wholesale' : 'product-card';
        const badgeHTML = p.badge ? `<div class="product-badge${p.isWholesale ? ' wholesale-badge' : ''}">${p.badge}</div>` : '';
        const peppersHTML = Array(p.peppers).fill('<i class="fas fa-pepper-hot"></i>').join('\n                            ');
        let spicyContent = peppersHTML;
        if (p.isWholesale) {
            spicyContent = '<i class="fas fa-handshake"></i>\n                            <i class="fas fa-truck"></i>\n                            <i class="fas fa-store"></i>';
        }
        const priceHTML = (p.priceOrig || p.priceSale) ? `
                        <div class="product-price">
                            ${p.priceOrig ? `<span class="price-original">${p.priceOrig}</span>` : ''}
                            ${p.priceSale ? `<span class="price-sale">${p.priceSale}</span>` : ''}
                            ${p.priceUnit ? `<span class="price-unit">${p.priceUnit}</span>` : ''}
                        </div>` : '';

        return `                <div class="${cardClass}">
                    ${badgeHTML}
                    <div class="product-image">
                        <div class="product-bottle-small ${p.color}">
                            <div class="bottle-label">
                                <div class="label-header">${p.labelHeader}</div>
                                <div class="label-text">${p.labelText}</div>
                            </div>
                        </div>
                        <div class="spicy-level">
                            ${spicyContent}
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${p.name}</h3>
                        <p class="product-description">${p.desc}</p>${priceHTML}
                        <div class="product-buttons">
                            <a href="app.html" class="btn btn-primary" style="justify-content: center; width: 100%;">
                                <i class="fas fa-shopping-cart"></i> ${p.isWholesale ? 'Đặt Mua Buôn' : 'Đặt Mua Nhanh'}
                            </a>
                            <button class="btn btn-buy" onclick="callNow()">
                                <i class="fas fa-phone"></i> Gọi Ngay
                            </button>
                            <button class="btn btn-zalo" onclick="contactZalo()">
                                <i class="fab fa-zalo"></i> Zalo
                            </button>
                        </div>
                    </div>
                </div>`;
    }).join('\n\n');
}

async function saveProducts() {
    if (!state.githubToken) { showToast('Chưa cấu hình GitHub Token!', 'error'); return; }
    if (!productList.length) { showToast('Không có sản phẩm nào!', 'error'); return; }

    const btn = document.getElementById('btnSaveProducts');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
        // Rebuild products section
        const newProductsHTML = buildProductsHTML(productList);

        // Replace products-grid content in index.html
        const gridStart = indexHtmlContent.indexOf('<div class="products-grid">');
        if (gridStart === -1) throw new Error('Không tìm thấy products-grid trong index.html');

        // Find the matching closing </div> for products-grid
        let depth = 0;
        let gridEnd = -1;
        const searchStart = gridStart + '<div class="products-grid">'.length;
        for (let i = searchStart; i < indexHtmlContent.length; i++) {
            if (indexHtmlContent.substring(i, i + 4) === '<div') depth++;
            if (indexHtmlContent.substring(i, i + 6) === '</div>') {
                if (depth === 0) { gridEnd = i + 6; break; }
                depth--;
            }
        }
        if (gridEnd === -1) throw new Error('Không tìm được cấu trúc products-grid');

        const updatedHTML = indexHtmlContent.substring(0, gridStart) +
            '<div class="products-grid">\n' + newProductsHTML + '\n\n            </div>' +
            indexHtmlContent.substring(gridEnd);

        await githubCreateFile('index.html', updatedHTML, `🛒 Cập nhật ${productList.length} sản phẩm`);
        indexHtmlContent = updatedHTML;

        showToast(`✅ Đã cập nhật ${productList.length} sản phẩm lên trang chủ!`, 'success');
    } catch (err) {
        showToast(`Lỗi: ${err.message}`, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Lưu & Push Lên GitHub';
}
