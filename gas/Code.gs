const SHEETS = {
  Registrations: [
    'reg_id', 'created_at', 'source', 'full_name', 'phone', 'mmid', 'company',
    'age_20_confirmed', 'pdpa_consent', 'sales_name', 'match_method', 'status',
    'checked_in_at', 'checked_in_by', 'note', 'tier', 'short_code'
  ],
  Sales_List: [],
  Checkin_Log: ['timestamp', 'reg_id', 'full_name', 'result', 'scanned_by', 'device'],
  Lucky_Draw: ['timestamp', 'round', 'tier', 'reg_id', 'full_name', 'status', 'drawn_by'],
  Settings: ['key', 'value', 'description']
};

const DEFAULT_SETTINGS = [
  ['event_name', 'Wine & Spirits Discovery 2026', 'ชื่องาน'],
  ['event_date', '2026-11-06', 'วันที่จัดงาน (ปี-เดือน-วัน)'],
  ['event_time', '17:00 – 21:00 น.', 'เวลางาน'],
  ['event_venue', 'Vela Grand Ballroom, Cape Dara Resort Pattaya', 'สถานที่จัดงาน'],
  ['registration_open', true, 'TRUE = เปิดรับลงทะเบียน, FALSE = ปิด'],
  ['max_capacity', 800, 'จำนวนผู้เข้างานสูงสุด'],
  ['target_vvip', 100, 'เป้าจำนวน VVIP'],
  ['target_vip', 500, 'เป้าจำนวน VIP'],
  ['target_walkin', 200, 'เป้าจำนวน Walk-in'],
  ['invite_code_vvip', '', 'รหัสในลิงก์เชิญ VVIP (สุ่มให้ตอน setup) เปลี่ยนแล้วลิงก์เก่าจะกลายเป็น Walk-in'],
  ['invite_code_vip', '', 'รหัสในลิงก์เชิญ VIP (สุ่มให้ตอน setup) เปลี่ยนแล้วลิงก์เก่าจะกลายเป็น Walk-in'],
  ['sales_col_mmid', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บ MMID'],
  ['sales_col_phone', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บเบอร์โทร'],
  ['sales_col_sales_name', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บชื่อเซลส์'],
  ['sales_col_customer_name', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บชื่อลูกค้า']
];

// ค่าเริ่มต้นรุ่นแรก ถ้ายังไม่มีใครแก้ จะอัปเดตเป็นข้อมูลงานจริงตอนรัน setup
const OLD_DEFAULTS = { event_name: 'Pattaya Event', event_venue: 'Pattaya', event_date: '' };

// รันจาก Apps Script editor (รันซ้ำได้ ไม่ทับข้อมูลเดิม ใช้อัปเกรดโครง Sheet ด้วย)
function setup() {
  const ss = SpreadsheetApp.getActive();

  Object.keys(SHEETS).forEach(function (name) {
    const headers = SHEETS[name];
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (!headers.length) return;
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
      return;
    }
    // เพิ่มคอลัมน์ใหม่ต่อท้าย ถ้า Sheet เดิมยังไม่มี
    const have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    const missing = headers.filter(function (h) { return have.indexOf(h) === -1; });
    if (missing.length) {
      sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    }
  });

  // phone และ mmid เป็น text เพื่อไม่ให้เลข 0 นำหน้าหาย
  const reg = ss.getSheetByName('Registrations');
  const regHead = reg.getRange(1, 1, 1, reg.getLastColumn()).getValues()[0].map(String);
  ['phone', 'mmid', 'short_code'].forEach(function (col) {
    reg.getRange(1, regHead.indexOf(col) + 1, reg.getMaxRows(), 1).setNumberFormat('@');
  });
  if (reg.getLastRow() > 1) {
    // แถวเก่าที่ยังไม่มีกลุ่ม ให้เป็น Walk-in
    const tierRange = reg.getRange(2, regHead.indexOf('tier') + 1, reg.getLastRow() - 1, 1);
    tierRange.setValues(tierRange.getValues().map(function (v) { return [v[0] || 'Walk-in']; }));
    // แถวเก่าที่ยังไม่มีรหัสสำรอง 5 ตัว
    const t = readRegs_();
    const codeRange = reg.getRange(2, regHead.indexOf('short_code') + 1, reg.getLastRow() - 1, 1);
    codeRange.setValues(codeRange.getValues().map(function (v) {
      if (v[0]) return [v[0]];
      const c = newShortCode_(t);
      t.byCode[c] = true;
      return [c];
    }));
  }

  const settings = ss.getSheetByName('Settings');
  const existing = settings.getLastRow() > 1
    ? settings.getRange(2, 1, settings.getLastRow() - 1, 2).getValues()
    : [];
  const keys = existing.map(function (r) { return r[0]; });
  existing.forEach(function (r, i) {
    if (r[0] in OLD_DEFAULTS && r[1] === OLD_DEFAULTS[r[0]]) {
      const def = DEFAULT_SETTINGS.find(function (d) { return d[0] === r[0]; });
      settings.getRange(i + 2, 2).setValue(def[1]);
    }
    if (/^invite_code_/.test(r[0]) && !r[1]) settings.getRange(i + 2, 2).setValue(randomCode_());
  });
  const newRows = DEFAULT_SETTINGS
    .filter(function (r) { return keys.indexOf(r[0]) === -1; })
    .map(function (r) { return /^invite_code_/.test(r[0]) ? [r[0], randomCode_(), r[2]] : r; });
  if (newRows.length) {
    settings.getRange(settings.getLastRow() + 1, 1, newRows.length, 3).setValues(newRows);
  }

  // ลบชีตเปล่าที่ติดมาตอนสร้างไฟล์ (Sheet1 / ชีต1)
  ss.getSheets().forEach(function (sh) {
    if (!(sh.getName() in SHEETS) && sh.getLastRow() === 0 && sh.getLastColumn() === 0) {
      ss.deleteSheet(sh);
    }
  });

  // ตั้งรหัสเฉพาะครั้งแรก ถ้าเปลี่ยนรหัสใน Script Properties แล้ว รันซ้ำจะไม่ทับ
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('STAFF_PASS')) props.setProperty('STAFF_PASS', DEFAULT_STAFF_PASS);
  if (!props.getProperty('ADMIN_PASS')) props.setProperty('ADMIN_PASS', DEFAULT_ADMIN_PASS);

  Logger.log('setup เสร็จแล้ว');
}

function randomCode_() {
  const A = 'abcdefghjkmnpqrstuvwxyz23456789';
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  let s = '';
  for (let i = 0; i < 8; i++) s += A[(b[i] + 256) % A.length];
  return s;
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
