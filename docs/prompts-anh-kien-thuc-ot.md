# Câu lệnh tạo ảnh nền cho loạt bài "Kiến thức ớt"

Cách dùng: dán từng câu lệnh vào ChatGPT (hoặc Gemini, Bing Image Creator...), tải ảnh về,
lưu vào `images/kb/bg/` đúng tên file ghi ở mỗi mục. Sau đó chạy:

```
python tools/make_kb_card.py content_series_kien_thuc_ot.json
```

Script sẽ phủ chữ + số liệu + logo lên ảnh nền. Vì chữ nằm ở **nửa dưới** ảnh, mọi câu lệnh
đều yêu cầu chủ thể ở **nửa trên**, nửa dưới để trống/tối.

## Đoạn STYLE dùng chung (đã ghép sẵn vào từng câu lệnh bên dưới)

> Square 1:1 photo, 1080x1080. Warm moody food photography, deep red and dark brown tones,
> soft window light, shallow depth of field. Main subject in the UPPER half; LOWER half is a
> dark, out-of-focus wooden table with lots of empty space for text overlay.
> Absolutely NO text, NO letters, NO labels, NO logos, NO watermark, NO bottles or jars with writing.

---

## ƯU TIÊN 1 — 4 bài mẫu

### #01 Nguồn gốc ớt (Mexico) → lưu `images/kb/bg/kb-01.png`
```
Square 1:1 photo, 1080x1080. Ancient clay bowl filled with dried and fresh red chili peppers on a rustic stone surface, a few chili seeds scattered, faint Aztec-style carved stone pattern blurred in the background, warm sunset light from the side. Warm moody food photography, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus stone table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #04 Top 5 ớt cay nhất thế giới → lưu `images/kb/bg/kb-04.png`
```
Square 1:1 photo, 1080x1080. Five different extremely hot chili peppers lined up on dark slate: a wrinkled red Carolina Reaper with a scorpion tail, a chocolate-brown 7 Pot, a bumpy Trinidad Scorpion, a small Vietnamese bird's eye chili at the end, dramatic red rim light, faint red smoke rising. Warm moody food photography, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is dark out-of-focus slate with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #06 7 tác dụng của ớt → lưu `images/kb/bg/kb-06.png`
```
Square 1:1 photo, 1080x1080. Fresh red bird's eye chilies next to a halved orange and a few green leaves on a wooden board, water droplets on the chilies, bright and healthy feeling, soft morning window light. Warm food photography, deep red and warm brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #07 Ăn ớt có giảm cân? → lưu `images/kb/bg/kb-07.png`
```
Square 1:1 photo, 1080x1080. A steaming bowl of Vietnamese pho with fresh herbs, a small dish of thick dark-red chili paste beside it, a measuring tape loosely placed near the bowl, chopsticks resting on the rim, soft window light. Warm moody food photography, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

---

## ƯU TIÊN 2 — 8 bài còn lại

### #02 Vì sao gọi ớt là "pepper" → `images/kb/bg/kb-02.png`
```
Square 1:1 photo, 1080x1080. Old wooden spice merchant table: a small heap of black peppercorns on the left, a heap of fresh red chili peppers on the right, an antique brass scale between them, a vintage world map blurred in the background, candle light. Warm moody still life, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #03 Thang Scoville → `images/kb/bg/kb-03.png`
```
Square 1:1 photo, 1080x1080. A row of chili peppers arranged from mild to extreme: green bell pepper, jalapeño, cayenne, habanero, Carolina Reaper, laid on dark slate like a gradient from green to deep red, dramatic side light, tiny flames of red chili flakes at the hot end. Warm moody food photography, shallow depth of field. Main subject in the UPPER half; LOWER half is dark out-of-focus slate with lots of empty space for text overlay. Absolutely NO text, NO letters, NO numbers, NO labels, NO logos, NO watermark.
```

### #05 Các loại ớt Việt Nam → `images/kb/bg/kb-05.png`
```
Square 1:1 photo, 1080x1080. Vietnamese market bamboo basket with several kinds of local chilies: tiny bird's eye chilies pointing upward, long curved horn chilies, small round wild chilies, mixed red and green, natural daylight in a rustic market stall. Warm food photography, deep red and warm brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #08 Ăn cay có nổi mụn? → `images/kb/bg/kb-08.png`
```
Square 1:1 photo, 1080x1080. Fresh red chilies beside a glass of water and a small bowl of plain yogurt on a clean light wooden board, a few mint leaves, fresh and clean skincare mood, soft natural light. Warm food photography, red and cream tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark, NO people.
```

### #09 7 nhóm người nên hạn chế ăn ớt → `images/kb/bg/kb-09.png`
```
Square 1:1 photo, 1080x1080. A single red chili pepper placed on a white ceramic plate next to a wooden spoon, calm and restrained mood, muted warm light, lots of negative space, suggesting moderation. Warm minimal food photography, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #10 Chữa cay miệng → `images/kb/bg/kb-10.png`
```
Square 1:1 photo, 1080x1080. A glass of cold milk, a bowl of white rice and a slice of bread next to a few red chilies, one chili with a tiny wisp of smoke, cozy kitchen counter, soft warm light. Warm food photography, deep red and cream tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #11 Bản đồ tương ớt 3 miền → `images/kb/bg/kb-11.png`
```
Square 1:1 photo, 1080x1080. Three small ceramic dishes of chili sauce in a row: dark red thick paste, orange-red paste with lemongrass bits, brighter red smooth sauce with garlic, on a bamboo tray with fresh herbs, overhead-angled view, soft daylight. Warm food photography, deep red and warm brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

### #12 Tự làm tương ớt tại nhà → `images/kb/bg/kb-12.png`
```
Square 1:1 photo, 1080x1080. Home kitchen scene: a mortar and pestle with freshly crushed red chili, a pile of whole bird's eye chilies, a small dish of sea salt and a bottle of rice vinegar without label, hands not visible, warm afternoon window light. Warm moody food photography, deep red and dark brown tones, shallow depth of field. Main subject in the UPPER half; LOWER half is a dark, out-of-focus wooden table with lots of empty space for text overlay. Absolutely NO text, NO letters, NO labels, NO logos, NO watermark.
```

---

## Lưu ý

- Nếu ảnh ra có chữ/nhãn lạ → bảo ChatGPT: "Remove all text and labels, keep everything else."
- Nếu chủ thể nằm giữa ảnh, chữ sẽ đè lên → bảo: "Move the subject to the top third, leave the bottom half dark and empty."
- ChatGPT free giới hạn số ảnh/ngày, nên làm 4 ảnh ưu tiên 1 trước.
- Không nhờ AI vẽ **chai sản phẩm có nhãn** — nó sẽ bịa chữ trên nhãn. Ảnh chai thật anh tự chụp.
