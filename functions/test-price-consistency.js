/**
 * Chot chan gia: gia hien dang nam o 3 noi khac nhau.
 *
 *   functions/catalog.js  -> nguon su that, server tinh tien theo cai nay
 *   app.html (PRICES)     -> chi de hien thi khi khach bam +/-
 *   index.html            -> chu trong trang va JSON-LD cho Google
 *
 * Trang tinh nen khong the gop lam mot ma khong dung build tool. Nhung neu
 * chung lech nhau thi khach thay mot gia con bi tinh mot gia khac - mat long
 * tin ngay. Bai test nay khong gop chung lai, no chi bao dong khi lech.
 *
 *   node functions/test-price-consistency.js
 */

const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('./catalog');

const goc = path.join(__dirname, '..');
const doc = f => fs.readFileSync(path.join(goc, f), 'utf8');

let pass = 0, fail = 0;
const check = (label, ok, detail) => {
    if (ok) { pass++; console.log('  ok   ' + label); }
    else { fail++; console.log('  FAIL ' + label + '  ->  ' + detail); }
};

const appHtml = doc('app.html');
const indexHtml = doc('index.html');

console.log('\n=== app.html khop voi catalog.js ===');
const khoiPrices = appHtml.match(/const PRICES = \{([\s\S]*?)\};/);
if (!khoiPrices) {
    check('tim thay khoi PRICES trong app.html', false, 'khong tim thay');
} else {
    for (const [key, spec] of Object.entries(PRODUCTS)) {
        const m = khoiPrices[1].match(new RegExp(`${key}\\s*:\\s*(\\d+)`));
        check(`${key} = ${spec.price}`, m && Number(m[1]) === spec.price,
            m ? `app.html ghi ${m[1]}` : 'khong khai bao');
    }
}

console.log('\n=== gia hien thi tren index.html ===');
for (const [key, spec] of Object.entries(PRODUCTS)) {
    // Trang dang dung ca 2 kieu ngan cach: "30.000" va "₫30,000"
    const kieuVn = spec.price.toLocaleString('vi-VN');   // 30.000
    const kieuEn = spec.price.toLocaleString('en-US');   // 30,000
    check(`${key} co hien gia ${kieuVn}`,
        indexHtml.includes(kieuVn) || indexHtml.includes(kieuEn),
        `khong thay "${kieuVn}" hay "${kieuEn}" trong index.html`);
}

console.log('\n=== JSON-LD (gia Google doc duoc) ===');
const giaJsonLd = [...indexHtml.matchAll(/"price":\s*"(\d+)"/g)].map(m => Number(m[1]));
check('co it nhat 1 gia trong JSON-LD', giaJsonLd.length > 0, 'khong co');
const giaHopLe = Object.values(PRODUCTS).map(p => p.price);
for (const g of giaJsonLd) {
    check(`gia ${g} co trong bang gia`, giaHopLe.includes(g),
        `JSON-LD ghi ${g}, bang gia chi co ${giaHopLe.join(', ')}`);
}

console.log(`\n========= KET QUA: ${pass} dat / ${fail} loi =========\n`);
if (fail > 0) {
    console.log('Gia dang lech nhau. Sua cho lech roi chay lai.\n');
}
process.exit(fail > 0 ? 1 : 0);
