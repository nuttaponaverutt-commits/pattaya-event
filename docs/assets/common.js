// เรียก API (text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง CORS preflight)
async function api(action, data) {
  try {
    const res = await fetch(window.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action }, data || {}))
    });
    return await res.json();
  } catch (e) {
    return { ok: false, network: true, error: 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่' };
  }
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

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, CARD_W, CARD_H);
  g.fillStyle = '#0f1f3d';
  g.fillRect(0, 0, CARD_W, 150);
  g.fillStyle = '#b8955a';
  g.fillRect(0, 150, CARD_W, 6);

  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = '600 38px ' + font;
  g.fillText(fitText(g, info.event_name || 'Pattaya Event', CARD_W - 80), CARD_W / 2, 72);
  g.font = '400 24px ' + font;
  g.fillStyle = '#d9c7a3';
  g.fillText([thaiDate(info.event_date), info.event_venue].filter(Boolean).join('  |  '), CARD_W / 2, 116);

  g.fillStyle = '#1c1c1c';
  g.font = '600 40px ' + font;
  g.fillText(fitText(g, info.full_name || '', CARD_W - 80), CARD_W / 2, 230);

  const qr = qrcode(0, 'M');
  qr.addData(info.reg_id);
  qr.make();
  const n = qr.getModuleCount();
  const size = 460;
  const cell = Math.floor(size / (n + 8));
  const qrPx = cell * (n + 8);
  const x0 = (CARD_W - qrPx) / 2;
  const y0 = 270;
  g.fillStyle = '#ffffff';
  g.fillRect(x0, y0, qrPx, qrPx);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(r, col)) g.fillRect(x0 + (col + 4) * cell, y0 + (r + 4) * cell, cell, cell);
    }
  }

  g.fillStyle = '#1c1c1c';
  g.font = '600 34px "IBM Plex Mono", monospace';
  g.fillText(info.reg_id, CARD_W / 2, y0 + qrPx + 50);

  g.strokeStyle = '#ddd6c8';
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
  try { localStorage.setItem('pe_reg', JSON.stringify({ reg_id: info.reg_id, full_name: info.full_name })); } catch (e) {}
}

function loadMyReg() {
  try { return JSON.parse(localStorage.getItem('pe_reg') || 'null'); } catch (e) { return null; }
}
