// ตัวช่วยร่วมของหน้า Staff และ Admin

function loadSession(key) {
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (s && s.token && s.expires_at > Date.now()) return s;
  } catch (e) {}
  return null;
}

function saveSession(key, s) {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {}
}

function clearSession(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

let toastTimer;
function toast(msg, isErr) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, isErr ? 4000 : 2200);
}

// เปิด popup แบบ sheet; คืน element ของ overlay (เรียก closeSheet() เพื่อปิด)
function openSheet(html, onClose) {
  // เปลี่ยนแผ่นเดิมเป็นแผ่นใหม่ ไม่นับเป็นการปิด (ไม่งั้นกล้องจะสแกนต่อทั้งที่ผลยังแสดงอยู่)
  const old = $('#sheetOverlay');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'sheetOverlay';
  ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
  ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
  ov._onClose = onClose;
  document.body.appendChild(ov);
  return ov;
}

function closeSheet() {
  const ov = $('#sheetOverlay');
  if (!ov) return;
  ov.remove();
  if (ov._onClose) ov._onClose();
}

function tierPill(tier) {
  const t = tier || 'Walk-in';
  return '<span class="tier-pill tier-' + esc(t) + '">' + esc(t) + '</span>';
}

function personDetails(p) {
  const t = p.tier || 'Walk-in';
  return '<div class="wristband tier-' + esc(t) + '"><small>Wristband</small>' + esc(t) + '</div>' +
    '<p class="person-name">' + esc(p.full_name) + '</p>' +
    '<dl class="kv">' +
    '<dt>MMID</dt><dd>' + esc(p.mmid || '-') + '</dd>' +
    '<dt>ร้าน/บริษัท</dt><dd>' + esc(p.company || '-') + '</dd>' +
    '<dt>เบอร์โทร</dt><dd>' + esc(p.phone || '-') + '</dd>' +
    '<dt>Sales</dt><dd>' + esc(p.sales_name || 'ไม่มี Sales') + '</dd>' +
    '<dt>รหัส</dt><dd>' + esc(p.short_code || p.reg_id) + '</dd>' +
    '</dl>';
}

function statusBadge(status) {
  return status === 'มาแล้ว'
    ? '<span class="badge badge-in">มาแล้ว</span>'
    : '<span class="badge badge-pending">ยังไม่มา</span>';
}

function deviceLabel(station) {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Other';
  return station + ' / ' + os;
}
