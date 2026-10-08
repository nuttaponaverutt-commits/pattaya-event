// คำสั่งที่ส่งซ้ำได้ปลอดภัย (ส่งซ้ำแล้วไม่เกิดข้อมูลซ้ำ) ใช้ลองใหม่อัตโนมัติตอนเน็ตสะดุดหรือระบบยุ่ง
const RETRY_SAFE = ['config', 'register', 'lookup', 'login', 'scan', 'checkin', 'search', 'staff_register',
  'dashboard', 'list', 'sales_names', 'links', 'draw_list', 'logout'];

// เรียก API (text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง CORS preflight)
async function api(action, data) {
  const tries = RETRY_SAFE.indexOf(action) !== -1 ? 4 : 1;
  let last;
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise(function (r) { setTimeout(r, 1200 * i + Math.random() * 1200); });
    // Google บางช่วงตอบช้ามาก รอไม่เกิน 30 วินาทีต่อครั้ง แล้วส่งใหม่
    const ctrl = window.AbortController ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 30000) : null;
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
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return s || '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('th-TH', { dateStyle: 'long' });
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

  const display = '"Playfair Display", ' + font;
  const tier = info.tier || 'Walk-in';
  const tierColors = { 'VVIP': ['#b48d3e', '#151412'], 'VIP': ['#151412', '#e4cf9c'], 'Walk-in': ['#e7e2d6', '#3a372f'] }[tier] || ['#e7e2d6', '#3a372f'];

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
  g.fillText(fitText(g, [thaiDate(info.event_date), info.event_time].filter(Boolean).join('  •  '), CARD_W - 80), CARD_W / 2, 112);
  g.fillText(fitText(g, info.event_venue || '', CARD_W - 80), CARD_W / 2, 146);

  g.fillStyle = '#1c1b18';
  g.font = '600 40px ' + font;
  g.fillText(fitText(g, info.full_name || '', CARD_W - 80), CARD_W / 2, 238);

  // แถบกลุ่มลูกค้า
  g.font = '600 24px ' + font;
  const tw = g.measureText(tier).width + 48;
  roundRect(g, (CARD_W - tw) / 2, 256, tw, 40, 20, tierColors[0]);
  g.fillStyle = tierColors[1];
  g.fillText(tier, CARD_W / 2, 284);

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
  g.fillText('รหัสเข้างาน (กรณีสแกนไม่ได้)', CARD_W / 2, y0 + qrPx + 34);
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
  g.fillText('แสดง QR นี้พร้อมบัตรประชาชน ณ จุดลงทะเบียนหน้างาน', CARD_W / 2, 910);
  g.fillText('สำหรับผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น', CARD_W / 2, 948);

  return c.toDataURL('image/png');
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
  btn.textContent = 'บันทึกรูป QR';
  host.appendChild(btn);

  const hint = document.createElement('p');
  hint.className = 'hint center';
  hint.textContent = 'หากกดบันทึกไม่ได้ ให้กดค้างที่รูปแล้วเลือก "บันทึกรูปภาพ" หรือแคปหน้าจอไว้';
  host.appendChild(hint);
}

function saveMyReg(info) {
  try { localStorage.setItem('pe_reg', JSON.stringify({ reg_id: info.reg_id, full_name: info.full_name, tier: info.tier, short_code: info.short_code })); } catch (e) {}
}

function loadMyReg() {
  try { return JSON.parse(localStorage.getItem('pe_reg') || 'null'); } catch (e) { return null; }
}
