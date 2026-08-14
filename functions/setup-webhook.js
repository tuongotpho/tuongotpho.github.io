/**
 * DANG KY WEBHOOK XAC NHAN DON VOI TELEGRAM
 *
 * Cach chay - doc token tu file (chay duoc o moi shell: PowerShell, CMD, Bash):
 *
 *   node functions/setup-webhook.js --token-file "C:/duong/dan/tk.txt"
 *
 * Hoac qua bien moi truong neu shell cua ban ho tro:
 *   Bash        : TELEGRAM_BOT_TOKEN=xxx node functions/setup-webhook.js
 *   PowerShell  : $env:TELEGRAM_BOT_TOKEN="xxx"; node functions/setup-webhook.js
 *
 * ⚠️ PHAI CHAY LAI MOI KHI REVOKE TOKEN.
 * Chuoi bi mat cua webhook duoc suy ra tu chinh bot token, nen doi token
 * la webhook cu ngung hoat dong (function se tra 403 cho moi su kien).
 *
 * Them tham so `--delete` de go webhook.
 */

const crypto = require('crypto');
const fs = require('fs');

const WEBHOOK_URL = 'https://asia-southeast1-tuongot-sieucay.cloudfunctions.net/telegramWebhook';

function docToken() {
    const i = process.argv.indexOf('--token-file');
    if (i !== -1) {
        const duongDan = process.argv[i + 1];
        if (!duongDan) {
            console.error('❌ Thieu duong dan sau --token-file');
            process.exit(1);
        }
        if (!fs.existsSync(duongDan)) {
            console.error('❌ Khong tim thay file:', duongDan);
            process.exit(1);
        }
        return fs.readFileSync(duongDan, 'utf8').replace(/^\uFEFF/, '').trim();
    }
    return (process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

const token = docToken();
if (!token) {
    console.error('❌ Chua cung cap bot token.');
    console.error('   Cach chac chan nhat:');
    console.error('   node functions/setup-webhook.js --token-file "C:/Users/Admin/tk.txt"');
    process.exit(1);
}
if (!/^\d+:[\w-]+$/.test(token)) {
    console.error('❌ Token doc duoc khong dung dinh dang (phai la <so>:<chuoi>).');
    console.error('   Do dai doc duoc:', token.length, '- token that thuong dai 46 ky tu.');
    process.exit(1);
}

// Phai khop y het ham webhookSecretFor() trong telegram.js
const secretToken = crypto.createHash('sha256').update(token).digest('hex');

async function main() {
    const xoa = process.argv.includes('--delete');

    if (xoa) {
        const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });
        const data = await res.json();
        console.log(data.ok ? '✅ Da go webhook.' : `❌ Loi: ${data.description}`);
        return;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: WEBHOOK_URL,
            secret_token: secretToken,
            // Chi can su kien bam nut. Khong nhan tin nhan de bot khong bi
            // dong tin rac, va de /start van do BotFather phu trach nhu cu.
            allowed_updates: ['callback_query'],
            drop_pending_updates: true
        })
    });

    const data = await res.json();
    if (!data.ok) {
        console.error(`❌ Dang ky that bai: ${data.error_code} ${data.description}`);
        process.exit(1);
    }

    console.log('✅ Da dang ky webhook thanh cong.');
    console.log('   URL:', WEBHOOK_URL);

    const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
    if (info.ok) {
        console.log('   Telegram xac nhan   :', info.result.url);
        console.log('   Co secret token     :', info.result.has_custom_certificate === false ? 'co' : '-');
        console.log('   Su kien nhan         :', (info.result.allowed_updates || []).join(', ') || 'tat ca');
        console.log('   Update dang cho      :', info.result.pending_update_count);
        if (info.result.last_error_message) {
            console.log('   ⚠️ Loi gan nhat     :', info.result.last_error_message);
        }
    }
}

main().catch(err => {
    console.error('❌ Loi ket noi:', err.message);
    process.exit(1);
});
