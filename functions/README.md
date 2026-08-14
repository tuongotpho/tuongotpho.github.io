# API Đặt Hàng — Tương Ớt Bông Ớt

Toàn bộ đơn hàng (từ web lẫn Telegram Mini App) đi qua **một endpoint duy nhất**: `POST /api/order`.

## Vì sao cần nó

| Trước | Sau |
|---|---|
| Bot token nằm trong JS công khai, ai cũng lấy được | Token nằm trong Secret Manager, client không bao giờ thấy |
| Giá tiền do client gửi lên | Server tính lại 100%, client sửa giá cũng vô ích |
| `api.telegram.org` bị chặn = mất đơn, không dấu vết | Đơn ghi vào Firestore **trước**, Telegram lỗi thì đơn vẫn còn |
| Bấm 2 lần = 2 đơn trùng | Cùng `clientKey` → trả về đúng đơn cũ |
| Không có mã đơn | Mỗi đơn có mã `BO-YYMMDD-NNN` |
| Ai cũng giả được "khách đặt từ Telegram" | Xác thực chữ ký HMAC `initData` theo chuẩn Telegram |

## Thiết lập lần đầu (làm 1 lần, trên máy anh)

**1. Nâng project lên gói Blaze**
https://console.firebase.google.com/project/tuongot-sieucay/usage/details
→ Nhớ đặt **Budget alert 200.000₫/tháng** để yên tâm tuyệt đối.
Function đã giới hạn `maxInstances: 5` nên chi phí thực tế gần như bằng 0₫.

**2. Firestore database** ✅ đã có

Database tên **`tuongot`** (Native mode, `asia-southeast1`) — **không phải `(default)`**.

Vì vậy hai chỗ này bắt buộc phải khai báo đúng tên, bỏ đi là function chết với lỗi `NOT_FOUND`:

- `functions/index.js`: `getFirestore('tuongot')`
- `firebase.json`: `"firestore": [{ "database": "tuongot", ... }]`

Nếu sau này tạo thêm database khác, phải sửa cả hai chỗ.

**3. Nạp bot token vào Secret Manager**

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN --project tuongot-sieucay
```

**4. Deploy lần đầu**

```bash
firebase deploy --only functions,firestore:rules --project tuongot-sieucay
```

**5. Kiểm tra endpoint sống chưa**

```bash
curl https://tuongot-sieucay.web.app/api/order -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"phone\":\"0982722036\",\"address\":\"So 8 ngo 135 Nui Truc, Ba Dinh, Ha Noi\",\"items\":{\"p350\":1},\"clientKey\":\"test-1\"}"
```

Kết quả mong đợi: `{"ok":true,"orderId":"BO-...","notified":true}` và Telegram của shop nhận được tin.

## Cấp quyền cho GitHub Actions (để CI tự deploy về sau)

Service account trong secret `FIREBASE_SERVICE_ACCOUNT_TUONGOT_SIECAY` hiện chỉ có quyền Hosting.
Vào [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=tuongot-sieucay), thêm cho nó các role:

- `Cloud Functions Developer`
- `Service Account User`
- `Cloud Build Editor`
- `Artifact Registry Writer`
- `Secret Manager Admin`
- `Cloud Datastore Owner` (để đẩy firestore rules)

Chưa cấp cũng không sao: job `deploy_order_api` được đặt `continue-on-error`, website vẫn deploy bình thường, chỉ là API phải deploy tay.

## Sau khi test xong — dọn token cũ

1. @BotFather → `/revoke` → lấy token mới
2. `firebase functions:secrets:set TELEGRAM_BOT_TOKEN` (dán token mới)
3. `firebase deploy --only functions`
4. Xoá `TELEGRAM_BOT_TOKEN` và `sendOrderDirectFallback` khỏi `app.html`, xoá khỏi `script.js` và `HANDOVER_CONTEXT.md`

## Chạy thử ở máy local

```bash
firebase emulators:start --only functions,firestore --project demo-tuongot
```

Cần file `functions/.secret.local` (đã có trong .gitignore):

```
TELEGRAM_BOT_TOKEN=123456:FAKE_TOKEN_FOR_LOCAL_TEST
```

Rồi chạy bộ kiểm thử (21 phép thử: tính tiền, chống trùng, chặn spam, xác thực Telegram):

```bash
node functions/test-order-api.js
```

Mở `app.html` ở `http://127.0.0.1:5173` thì client tự trỏ vào emulator, đặt thử thoải mái mà không đụng tới đơn thật.

## Dữ liệu lưu trong Firestore

| Collection | Nội dung |
|---|---|
| `orders/{BO-YYMMDD-NNN}` | Toàn bộ đơn: khách, sản phẩm, tổng tiền, kênh đặt, đã báo Telegram chưa |
| `counters/{YYMMDD}` | Bộ đếm số thứ tự đơn trong ngày |
| `orderKeys/{clientKey}` | Chống trùng khi khách bấm nhiều lần |
| `rateLimits/{bucket:danh-tinh}` | Chống spam |

`firestore.rules` chặn mọi truy cập từ trình duyệt — chỉ Cloud Function đọc ghi được.
