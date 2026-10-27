// คำสั่งที่ส่งซ้ำได้ปลอดภัย (ส่งซ้ำแล้วไม่เกิดข้อมูลซ้ำ) ใช้ลองใหม่อัตโนมัติตอนเน็ตสะดุดหรือระบบยุ่ง
const RETRY_SAFE = ['config', 'register', 'lookup', 'login', 'scan', 'checkin', 'search', 'staff_register',
  'dashboard', 'list', 'sales_names', 'links', 'draw_list', 'logout'];

// เรียก API (text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง CORS preflight)
// คำสั่งที่เขียนข้อมูลหรืออ่านทั้งชีต ปกติใช้เวลานานกว่า ให้รอนานกว่าคำสั่งอ่านทั่วไป
const SLOW_ACTIONS = ['register', 'checkin', 'staff_register', 'dashboard', 'list'];

async function api(action, data) {
  const safe = RETRY_SAFE.indexOf(action) !== -1;
  const tries = !safe ? 1 : (action === 'register' ? 5 : 4);
  const wait = SLOW_ACTIONS.indexOf(action) !== -1 ? 20000 : 12000;
  let last;
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise(function (r) { setTimeout(r, 800 * i + Math.random() * 1200); });
    // Google ค้างไม่ตอบเป็นบางครั้ง ไม่ต้องรอนาน ตัดแล้วส่งใหม่ (ครั้งสุดท้ายรอได้ถึง 30 วินาที)
    const ctrl = window.AbortController ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, i === tries - 1 ? 30000 : wait) : null;
    try {
      const res = await fetch(window.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action }, data || {})),
        signal: ctrl ? ctrl.signal : undefined
      });
      // ตอน Google รับคำขอไม่ไหว จะตอบเป็นหน้า HTML ไม่ใช่ JSON ให้ถือเป็นระบบยุ่ง
      last = await res.json().catch(function () { return { ok: false, busy: true, error: 'ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง' }; });
      if (!last.busy) {
        if (i > 0) last._retried = true;
        return last;
      }
    } catch (e) {
      last = { ok: false, network: true, error: 'เชื่อมต่อระบบไม่ได้ หรือระบบตอบช้าเกินไป กรุณาลองใหม่อีกครั้ง' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return last;
}

function thaiDate(s) {
  const d = parseEventDate(s);
  return d ? d.toLocaleDateString('th-TH', { dateStyle: 'long' }) : (s || '');
}

// วันที่งานจากระบบ: ปกติเป็น 2026-11-06 ถ้าได้แบบเวลา UTC (2026-11-05T17:00:00.000Z) ให้คิดเป็นวันตามเวลาไทย
function parseEventDate(s) {
  const str = String(s || '');
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const t = new Date(str);
    if (isNaN(t)) return null;
    const bkk = new Date(t.getTime() + 7 * 3600e3);
    return new Date(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate());
  }
  return null;
}

// สาขา Makro ให้ลูกค้าเลือกตอนลงทะเบียน [ค่าที่บันทึก (ชื่ออังกฤษ), ชื่อไทย] ต้องตรงกับ BRANCHES ใน gas/Api.gs
const BRANCHES = [
  ['Makro Ladpraw (ST01)', 'แม็คโคร สาขาลาดพร้าว (ST01)'],
  ['Makro Srinakarin (ST03)', 'แม็คโคร สาขาศรีนครินทร์ (ST03)'],
  ['Makro Sathon (ST18)', 'แม็คโคร สาขาสาทร (ST18)'],
  ['Makro Bang Phli (ST57)', 'แม็คโคร สาขาบางพลี (ST57)'],
  ['Makro Rayong (ST15)', 'แม็คโคร สาขาระยอง (ST15)'],
  ['Makro Chanthaburi (ST26)', 'แม็คโคร สาขาจันทบุรี (ST26)'],
  ['Makro Chonburi (ST05)', 'แม็คโคร สาขาชลบุรี (ST05)'],
  ['Makro South Pattaya (ST44)', 'แม็คโคร สาขาพัทยาใต้ (ST44)'],
  ['Makro North Pattaya (ST66)', 'แม็คโคร สาขาพัทยาเหนือ (ST66)'],
  ['Makro Lamchabang (ST109)', 'แม็คโคร สาขาแหลมฉบัง (ST109)'],
  ['Makro Bowin (ST131)', 'แม็คโคร สาขาบ่อวิน (ST131)'],
  ['Makro Sattahip (ST132)', 'แม็คโคร สาขาสัตหีบ (ST132)'],
  ['Makro Amata Nakorn (ST134)', 'แม็คโคร สาขาอมตะนคร (ST134)'],
  ['Makro Amata Nakorn 2 (ST162)', 'แม็คโคร สาขาอมตะนคร 2 (ST162)'],
  ['Makro Ban Bueng (ST168)', 'แม็คโคร สาขาบ้านบึง (ST168)'],
  ['Head Office', 'Head Office'],
  ['Other', 'อื่นๆ (โปรดระบุ)']
];

// ใส่ตัวเลือกสาขาใน <select> (thai = แสดงชื่อไทย) คงค่าที่เลือกไว้เดิม
function fillBranchSelect(sel, thai, placeholder) {
  const cur = sel.value;
  sel.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  sel.appendChild(ph);
  BRANCHES.forEach(function (b) {
    const o = document.createElement('option');
    o.value = b[0];
    o.textContent = thai ? b[1] : (b[0] === 'Other' ? 'Other (please specify)' : b[0]);
    sel.appendChild(o);
  });
  sel.value = cur;
}

function cleanPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 11 && d.indexOf('66') === 0) d = '0' + d.slice(2);
  if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d;
  return d;
}

// แสดงรูป KV ถ้ามีไฟล์ assets/kv.jpg ไม่มีก็ใช้ placeholder
function loadHero(el) {
  const img = new Image();
  img.onload = function () {
    el.classList.remove('hero-placeholder');
    el.innerHTML = '';
    img.alt = 'Key Visual';
    el.appendChild(img);
  };
  img.src = 'assets/kv.jpg?v=' + Date.now().toString().slice(0, 7);
}

const CARD_W = 720;
const CARD_H = 1000;

// วาดการ์ด QR เป็นรูป PNG (ชื่องาน, ชื่อผู้ลงทะเบียน, QR, รหัส)
async function drawQrCard(info) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = CARD_W;
  c.height = CARD_H;
  const g = c.getContext('2d');
  const font = '"IBM Plex Sans Thai", sans-serif';

  const display = '"Bodoni Moda", ' + font;

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, CARD_W, CARD_H);
  g.fillStyle = '#151412';
  g.fillRect(0, 0, CARD_W, 170);
  g.fillStyle = '#b48d3e';
  g.fillRect(0, 170, CARD_W, 5);

  g.textAlign = 'center';
  g.fillStyle = '#f4ecd8';
  g.font = '600 40px ' + display;
  g.fillText(fitText(g, info.event_name || 'Wine & Spirits Discovery 2026', CARD_W - 80), CARD_W / 2, 70);
  g.font = '400 23px ' + font;
  g.fillStyle = '#e4cf9c';
  g.fillText(fitText(g, [info.event_date_text || thaiDate(info.event_date), info.event_time].filter(Boolean).join('  •  '), CARD_W - 80), CARD_W / 2, 112);
  g.fillText(fitText(g, info.event_venue || '', CARD_W - 80), CARD_W / 2, 146);

  g.fillStyle = '#1c1b18';
  g.font = '600 40px ' + font;
  // ไม่แสดงกลุ่ม (VVIP / VIP / Walk-in) บนการ์ดของลูกค้า Staff เห็นกลุ่มและสีสายรัดตอนสแกน
  g.fillText(fitText(g, info.full_name || '', CARD_W - 80), CARD_W / 2, 250);

  const qr = qrcode(0, 'M');
  qr.addData(info.reg_id);
  qr.make();
  const n = qr.getModuleCount();
  const size = 440;
  const cell = Math.floor(size / (n + 8));
  const qrPx = cell * (n + 8);
  const x0 = (CARD_W - qrPx) / 2;
  const y0 = 310;
  g.fillStyle = '#ffffff';
  g.fillRect(x0, y0, qrPx, qrPx);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(r, col)) g.fillRect(x0 + (col + 4) * cell, y0 + (r + 4) * cell, cell, cell);
    }
  }

  // รหัสสำรอง 5 ตัว ให้ Staff พิมพ์แทนเมื่อสแกนไม่ได้
  g.fillStyle = '#6c675d';
  g.font = '400 22px ' + font;
  g.fillText(cardText('card.code', 'รหัสเข้างาน (กรณีสแกนไม่ได้)'), CARD_W / 2, y0 + qrPx + 34);
  g.fillStyle = '#1c1b18';
  g.font = '600 46px "IBM Plex Mono", monospace';
  g.fillText(spaced(info.short_code || info.reg_id), CARD_W / 2, y0 + qrPx + 84);

  g.strokeStyle = '#ddd5c4';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(60, 860);
  g.lineTo(CARD_W - 60, 860);
  g.stroke();
  g.fillStyle = '#6b6b6b';
  g.font = '400 24px ' + font;
  g.fillText(fitText(g, cardText('card.l1', 'แสดง QR นี้พร้อมบัตรประชาชน ณ จุดลงทะเบียนหน้างาน'), CARD_W - 60), CARD_W / 2, 910);
  g.fillText(cardText('card.l2', 'สำหรับผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น'), CARD_W / 2, 948);

  return c.toDataURL('image/png');
}

// ข้อความบนการ์ด: หน้าลูกค้าใช้ตามภาษาที่เลือก (i18n.js) หน้า Staff/หลังบ้านใช้ภาษาไทย
function cardText(key, thai) {
  return typeof t === 'function' ? t(key) : thai;
}

function spaced(code) {
  const c = String(code || '');
  return c.length <= 6 ? c.split('').join(' ') : c;
}

function roundRect(g, x, y, w, h, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.fill();
}

function fitText(g, text, maxW) {
  let t = String(text);
  if (g.measureText(t).width <= maxW) return t;
  while (t.length > 1 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// แสดงการ์ด QR ใน element ที่กำหนด พร้อมปุ่มบันทึกรูป
async function showQrCard(host, info) {
  const url = await drawQrCard(info);
  host.innerHTML = '';
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'QR สำหรับเข้างาน ' + info.reg_id;
  img.className = 'qr-card';
  host.appendChild(img);

  const btn = document.createElement('a');
  btn.className = 'btn btn-primary btn-block';
  btn.href = url;
  btn.download = 'QR-' + info.reg_id + '.png';
  btn.textContent = cardText('card.save', 'บันทึกรูป QR');
  host.appendChild(btn);

  const hint = document.createElement('p');
  hint.className = 'hint center';
  hint.textContent = cardText('card.hint', 'หากกดบันทึกไม่ได้ ให้กดค้างที่รูปแล้วเลือก "บันทึกรูปภาพ" หรือแคปหน้าจอไว้');
  host.appendChild(hint);
}

function saveMyReg(info) {
  try { localStorage.setItem('pe_reg', JSON.stringify({ reg_id: info.reg_id, full_name: info.full_name, tier: info.tier, short_code: info.short_code })); } catch (e) {}
}

function loadMyReg() {
  try { return JSON.parse(localStorage.getItem('pe_reg') || 'null'); } catch (e) { return null; }
}
