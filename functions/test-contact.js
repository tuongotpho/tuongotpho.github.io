/**
 * Kiem thu form lien he / tu van tren Firebase Emulator.
 *
 *   firebase emulators:start --only functions,firestore --project demo-tuongot
 *   node functions/test-contact.js
 */

const BASE = 'http://127.0.0.1:5001/demo-tuongot/asia-southeast1';

let pass = 0, fail = 0;
const check = (label, ok, detail) => {
    if (ok) { pass++; console.log('  ok   ' + label); }
    else { fail++; console.log('  FAIL ' + label + '  ->  ' + JSON.stringify(detail)); }
};

const RUN = Math.floor(Math.random() * 200);
const IP = n => `203.0.${RUN}.${n}`;

const post = (body, ip) => fetch(`${BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip || IP(1) },
    body: JSON.stringify(body)
}).then(async r => ({ s: r.status, d: await r.json().catch(() => ({})) }));

const base = { name: 'Chị Hoa Quán Phở', phone: '0912 345 678' };

(async () => {
    console.log('\n=== 1. Lien he mua buon hop le ===');
    const k = 'lh-' + Date.now();
    const r1 = await post({
        ...base, clientKey: k, need: 'buon',
        address: '88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        message: 'Quán em dùng khoảng 20 lít/tháng, báo giá giúp em'
    });
    check('HTTP 200', r1.s === 200, r1);
    check('co ma lien he LH-', /^LH-\d{6}-\d{3}$/.test(r1.d.enquiryId || ''), r1.d.enquiryId);

    console.log('\n=== 2. Gui lai lan 2 (chong trung) ===');
    const r2 = await post({ ...base, clientKey: k, need: 'buon' });
    check('duplicated = true', r2.d.duplicated === true, r2.d);
    check('tra ve dung ma cu', r2.d.enquiryId === r1.d.enquiryId, r2.d.enquiryId);

    console.log('\n=== 3. Dia chi va loi nhan la KHONG bat buoc ===');
    const r3 = await post({ ...base, clientKey: 'lh-toithieu-' + Date.now(), need: 'tuvan' });
    check('van nhan duoc lien he', r3.d.ok === true, r3.d);

    console.log('\n=== 4. Du lieu sai bi chan ===');
    const bad = [
        ['thieu ten', { phone: '0912345678' }],
        ['SDT sai', { name: 'Test', phone: 'abc' }],
        ['thieu SDT', { name: 'Test' }]
    ];
    for (const [label, body] of bad) {
        const r = await post({ ...body, clientKey: 'bad-' + Math.random() }, IP(2));
        check(`${label} -> 400 kem loi ro rang`, r.s === 400 && !!r.d.error, r.d);
    }

    console.log('\n=== 5. Nhu cau la bi ep ve "khac", khong lam sap ===');
    const r5 = await post({
        ...base, clientKey: 'lh-la-' + Date.now(), need: '<script>alert(1)</script>'
    }, IP(3));
    check('van nhan duoc lien he', r5.d.ok === true, r5.d);

    console.log('\n=== 6. Chan spam lien he ===');
    let chanO = null;
    for (let i = 1; i <= 7; i++) {
        const r = await post({ ...base, clientKey: `spam-${Date.now()}-${i}` }, IP(4));
        if (r.s === 429 && chanO === null) chanO = i;
    }
    check('bi chan tu lan thu 6', chanO === 6, 'chan o lan ' + chanO);

    console.log('\n=== 7. GET bi tu choi ===');
    const g = await fetch(`${BASE}/contact`);
    check('GET -> 405', g.status === 405, g.status);

    console.log(`\n=========== KET QUA: ${pass} dat / ${fail} loi ===========\n`);
    process.exit(fail > 0 ? 1 : 0);
})();
