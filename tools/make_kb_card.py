# -*- coding: utf-8 -*-
"""
Tạo ảnh bài "Kiến thức ớt" cho fanpage (1080x1080) từ file JSON.

Cách dùng (gõ trong PowerShell tại thư mục dự án):
    python tools/make_kb_card.py content_series_kien_thuc_ot.json          # tạo tất cả
    python tools/make_kb_card.py content_series_kien_thuc_ot.json 1,5,7    # chỉ vài bài

Mỗi bài trong JSON cần: stt, card.headline, card.facts [[số, nhãn], ...], card.bg (ảnh nền), image (đường dẫn ảnh ra).
Ảnh nền lấy trong thư mục images/, phủ lớp tối đỏ để chữ nổi. Font: Segoe UI (có sẵn trên Windows, đủ dấu tiếng Việt).
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = r'C:\Windows\Fonts'
W = H = 1080
RED = (200, 16, 46)
YELLOW = (255, 201, 60)
CREAM = (255, 240, 220)
WHITE = (255, 255, 255)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


F_BLACK = lambda s: font('seguibl.ttf', s)   # Segoe UI Black
F_BOLD = lambda s: font('segoeuib.ttf', s)
F_SEMI = lambda s: font('seguisb.ttf', s)
F_REG = lambda s: font('segoeui.ttf', s)


def cover(img, w, h):
    """Cắt ảnh nền cho vừa khung, giữ tỉ lệ (kiểu object-fit: cover)."""
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def wrap(draw, text, fnt, max_w):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def render(spec, out_path):
    card = spec['card']
    bg = Image.open(os.path.join(ROOT, card['bg'])).convert('RGB')
    im = cover(bg, W, H).filter(ImageFilter.GaussianBlur(card.get('blur', 1.2)))

    # Lớp phủ: tối nhẹ toàn ảnh + gradient đỏ sẫm từ giữa xuống đáy
    overlay = Image.new('RGBA', (W, H), (40, 5, 5, 70))
    grad = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    start = int(H * 0.30)
    for y in range(start, H):
        a = int(235 * ((y - start) / (H - start)) ** 0.8)
        gd.line([(0, y), (W, y)], fill=(58, 8, 8, a))
    im = Image.alpha_composite(im.convert('RGBA'), overlay)
    im = Image.alpha_composite(im, grad)
    d = ImageDraw.Draw(im)

    # Nhãn góc trái: KIẾN THỨC ỚT · #01
    tag = f"KIẾN THỨC ỚT  ·  #{spec['stt']:02d}"
    ft = F_BOLD(30)
    tw = d.textlength(tag, font=ft)
    d.rounded_rectangle([50, 50, 50 + tw + 50, 50 + 62], radius=31, fill=RED)
    d.text((75, 50 + 13), tag, font=ft, fill=WHITE)

    # Logo góc phải
    logo = Image.open(os.path.join(ROOT, 'images', 'new_logo.png')).convert('RGBA')
    logo.thumbnail((150, 150))
    im.alpha_composite(logo, (W - 50 - logo.width, 40))

    # Dựng khối chữ từ dưới lên: footer -> facts -> headline
    d = ImageDraw.Draw(im)
    y = H - 60
    ff = F_SEMI(28)
    footer = 'tuongotsieucay.web.app   ·   Zalo 0982.722.036   ·   Ngõ 135 Núi Trúc, Hà Nội'
    d.text((50, y - 34), footer, font=ff, fill=CREAM)
    y -= 34 + 22
    d.line([(50, y), (W - 50, y)], fill=(255, 255, 255, 90), width=2)
    y -= 30

    # Mỗi dòng sự kiện: số to màu vàng + nhãn (tối đa 2 dòng), tính chiều cao trước rồi vẽ từ trên xuống
    facts = card.get('facts', [])
    fn, fl = F_BLACK(52), F_REG(31)
    rows = []
    for num, label in facts:
        nw = d.textlength(num, font=fn)
        lines = wrap(d, label, fl, W - 100 - nw - 22)[:2]
        h = 20 + max(len(lines), 1) * 36 + 10 if len(lines) > 1 else 74
        rows.append((num, nw, lines, h))
    y -= sum(r[3] for r in rows)
    yy = y
    for num, nw, lines, h in rows:
        d.text((50, yy), num, font=fn, fill=YELLOW)
        for i, line in enumerate(lines):
            d.text((50 + nw + 22, yy + 14 + i * 36), line, font=fl, fill=WHITE)
        yy += h
    y -= 26

    fh = F_BLACK(card.get('headline_size', 66))
    lines = wrap(d, card['headline'], fh, W - 100)
    lh = int(fh.size * 1.12)
    y -= lh * len(lines)
    for i, line in enumerate(lines):
        d.text((50, y + i * lh), line, font=fh, fill=WHITE)

    sub = card.get('sub')
    if sub:
        fs = F_SEMI(32)
        d.text((52, y - 48), sub, font=fs, fill=YELLOW)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    im.convert('RGB').save(out_path, 'JPEG', quality=88, optimize=True)
    return out_path


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    posts = json.load(open(os.path.join(ROOT, sys.argv[1]), encoding='utf-8'))
    only = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
    for p in posts:
        if only and p['stt'] not in only:
            continue
        if 'card' not in p:
            continue
        out = render(p, os.path.join(ROOT, p['image']))
        print('✅', p['stt'], out, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()
