const BASE = 'http://127.0.0.1:5001/demo-tuongot/asia-southeast1';

let pass = 0, fail = 0;
const RUN = Math.floor(Math.random()*200);           // moi lan chay dung dai IP rieng
const IP = n => `198.51.${RUN}.${n}`;

async function post(body, ip) {
    const res = await fetch(`${BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip || IP(1) },
        body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
}

function check(label, cond, detail) {
    if (cond) { pass++; console.log('  ok   ' + label); }
    else { fail++; console.log('  FAIL ' + label + '  ->  ' + JSON.stringify(detail)); }
}

const baseOrder = {
    name: 'Lê Văn Thành',
    phone: '0982 722 036',
    address: 'Số 8, ngõ 135 Núi Trúc, Giảng Võ, Hà Nội',
    note: 'Giao giờ hành chính'
};

(async () => {
    console.log('\n=== 1. Health check ===');
    const h = await fetch(`${BASE}/health`).then(r => r.json());
    check('health tra ve ok', h.ok === true, h);

    console.log('\n=== 2. Don web hop le ===');
    const k1 = 'test-key-' + Date.now();
    const r1 = await post({ ...baseOrder, clientKey: k1, items: { p350: 2, p500: 1 }, clientTotal: 105000 });
    check('HTTP 200', r1.status === 200, r1);
    check('ok = true', r1.data.ok === true, r1.data);
    check('co ma don BO-', /^BO-\d{6}-\d{3}$/.test(r1.data.orderId || ''), r1.data.orderId);
    check('tong tien server = 105.000', r1.data.total === 105000, r1.data.total);
    check('notified = false (token gia)', r1.data.notified === false, r1.data.notified);

    console.log('\n=== 3. Bam lai lan 2 (cung clientKey) ===');
    const r2 = await post({ ...baseOrder, clientKey: k1, items: { p350: 2, p500: 1 } });
    check('duplicated = true', r2.data.duplicated === true, r2.data);
    check('tra ve DUNG ma don cu', r2.data.orderId === r1.data.orderId, r2.data.orderId);

    console.log('\n=== 4. Don moi -> so thu tu tang ===');
    const r3 = await post({ ...baseOrder, clientKey: 'test-key-' + Date.now() + '-b', items: { pBulk: 10 } });
    check('ma don khac don truoc', r3.data.orderId !== r1.data.orderId, r3.data.orderId);
    check('ban buon 10L = 600.000', r3.data.total === 600000, r3.data.total);

    console.log('\n=== 5. Client bao gia sai -> server van tinh dung ===');
    const r4 = await post({ ...baseOrder, clientKey: 'k-hack-' + Date.now(), items: { p350: 1 }, clientTotal: 1 });
    check('server ap gia 30.000, bo qua gia client', r4.data.total === 30000, r4.data.total);

    console.log('\n=== 6. Du lieu sai bi chan ===');
    const bad = [
        ['SDT sai', { ...baseOrder, phone: '123', items: { p350: 1 } }],
        ['dia chi qua ngan', { ...baseOrder, address: 'HN', items: { p350: 1 } }],
        ['thieu ten', { ...baseOrder, name: '', items: { p350: 1 } }],
        ['gio hang rong', { ...baseOrder, items: {} }],
        ['ban buon 3L (duoi toi thieu)', { ...baseOrder, items: { pBulk: 3 } }],
        ['so luong am', { ...baseOrder, items: { p350: -5 } }]
    ];
    // Cung 1 IP: khach nhap sai nhieu lan lien tiep KHONG duoc phep bi khoa.
    for (const [label, body] of bad) {
        const r = await post({ ...body, clientKey: 'bad-' + Math.random() }, IP(2));
        check(`${label} -> 400 kem loi ro rang`, r.status === 400 && !!r.data.error, r.data);
    }
    const afterMistakes = await post(
        { ...baseOrder, clientKey: 'after-' + Date.now(), items: { p350: 1 } }, IP(2));
    check('sau 6 lan nhap sai van dat hang duoc', afterMistakes.data.ok === true, afterMistakes.data);

    console.log('\n=== 7. Chan spam (5 don / 10 phut moi IP) ===');
    const spamIp = IP(3);
    let blockedAt = null;
    for (let i = 1; i <= 7; i++) {
        const r = await post({ ...baseOrder, clientKey: `spam-${Date.now()}-${i}`, items: { p350: 1 } }, spamIp);
        if (r.status === 429 && blockedAt === null) blockedAt = i;
    }
    check('bi chan tu don thu 6', blockedAt === 6, 'chan o don thu ' + blockedAt);

    console.log('\n=== 8. initData gia mao bi ha xuong don web ===');
    const r5 = await post({
        ...baseOrder, clientKey: 'fake-tg-' + Date.now(), items: { p350: 1 },
        initData: 'user=%7B%22id%22%3A999%7D&auth_date=9999999999&hash=deadbeef'
    }, IP(4));
    check('van nhan don (khong mat khach)', r5.data.ok === true, r5.data);

    console.log('\n=== 9. Method GET bi tu choi ===');
    const g = await fetch(`${BASE}/order`);
    check('GET -> 405', g.status === 405, g.status);

    console.log(`\n================ KET QUA: ${pass} dat / ${fail} loi ================\n`);
    process.exit(fail > 0 ? 1 : 0);
})();
