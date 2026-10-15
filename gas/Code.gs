const SHEETS = {
  Registrations: [
    'reg_id', 'created_at', 'source', 'full_name', 'phone', 'mmid', 'company',
    'age_20_confirmed', 'pdpa_consent', 'sales_name', 'match_method', 'status',
    'checked_in_at', 'checked_in_by', 'note', 'tier', 'short_code',
    'cust_no', 'customer_name', 'store'
  ],
  // รายชื่อลูกค้าเป้าหมาย นำเข้าจากหน้าหลังบ้าน (ไฟล์ยอด ALC หรือตาราง Excel ทั่วไป)
  Customers: [
    'mmid', 'cust_no', 'customer_name', 'customer_type', 'phone', 'contact_name',
    'sales_code', 'sales_name', 'store', 'region', 'spend_3m', 'suggested_tier',
    'invited', 'tier', 'note', 'updated_at'
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
  ['event_venue', 'Vela Grand Ballroom ชั้น 2, Cape Dara Resort Pattaya', 'สถานที่จัดงาน'],
  ['registration_open', true, 'TRUE = เปิดรับลงทะเบียน, FALSE = ปิด (แก้จากหลังบ้านได้)'],
  ['msg_full_title', 'ขออภัย ที่นั่งเต็มแล้ว', 'หัวข้อบนหน้าลงทะเบียนเมื่อครบจำนวน'],
  ['msg_full_body', 'ขณะนี้มีผู้ลงทะเบียนครบตามจำนวนที่กำหนดแล้ว ขอขอบพระคุณที่ให้ความสนใจในงาน Wine & Spirits Discovery 2026\nหากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง\nRegistration is now full. Thank you for your interest.', 'ข้อความเมื่อครบจำนวน (ขึ้นบรรทัดใหม่ได้)'],
  ['msg_closed_title', 'ปิดรับลงทะเบียนแล้ว', 'หัวข้อบนหน้าลงทะเบียนเมื่อปิดรับ'],
  ['event_time_en', '5.00 – 9.00 PM', 'เวลางาน (ภาษาอังกฤษ)'],
  ['event_venue_en', 'Vela Grand Ballroom, 2nd Floor, Cape Dara Resort Pattaya', 'สถานที่ (ภาษาอังกฤษ)'],
  ['msg_full_title_en', 'Registration is full', 'หัวข้อเมื่อครบจำนวน (ภาษาอังกฤษ)'],
  ['msg_full_body_en', 'All seats have now been taken. Thank you for your interest in Wine & Spirits Discovery 2026.\nIf you have already registered, you can view your entry QR using the button below.', 'ข้อความเมื่อครบจำนวน (ภาษาอังกฤษ)'],
  ['msg_closed_title_en', 'Registration is closed', 'หัวข้อเมื่อปิดรับ (ภาษาอังกฤษ)'],
  ['msg_closed_body_en', 'Registration for Wine & Spirits Discovery 2026 is now closed. Thank you for your interest.\nIf you have already registered, you can view your entry QR using the button below. For enquiries, please contact your Makro sales representative.', 'ข้อความเมื่อปิดรับ (ภาษาอังกฤษ)'],
  ['msg_closed_body','ขอขอบพระคุณที่ให้ความสนใจ ขณะนี้งาน Wine & Spirits Discovery 2026 ปิดรับลงทะเบียนเรียบร้อยแล้ว\nหากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง สอบถามเพิ่มเติม กรุณาติดต่อ Sales ที่ดูแลท่าน\nRegistration is now closed.', 'ข้อความเมื่อปิดรับ (ขึ้นบรรทัดใหม่ได้)'],
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
// ค่าเริ่มต้นรุ่นก่อนที่ยังไม่มีใครแก้ ให้อัปเดตเป็นค่าใหม่ด้วย
const OLD_VENUES = ['Pattaya', 'Vela Grand Ballroom, Cape Dara Resort Pattaya'];

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
  if (reg.getMaxRows() < 2000) reg.insertRowsAfter(reg.getMaxRows(), 2000 - reg.getMaxRows());
  const regHead = reg.getRange(1, 1, 1, reg.getLastColumn()).getValues()[0].map(String);
  ['phone', 'mmid', 'short_code', 'cust_no'].forEach(function (col) {
    reg.getRange(1, regHead.indexOf(col) + 1, reg.getMaxRows(), 1).setNumberFormat('@');
  });
  // จำไว้ว่าตั้งเป็น text ถึงแถวไหนแล้ว ตอนลงทะเบียนจะได้ไม่ต้องตั้งทีละช่อง (เขียนเร็วขึ้น)
  PropertiesService.getScriptProperties().setProperty('REG_TEXT_ROWS', String(reg.getMaxRows()));
  const cus = ss.getSheetByName('Customers');
  ['mmid', 'cust_no', 'phone', 'sales_code'].forEach(function (col) {
    cus.getRange(1, SHEETS.Customers.indexOf(col) + 1, cus.getMaxRows(), 1).setNumberFormat('@');
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
    if ((r[0] in OLD_DEFAULTS && r[1] === OLD_DEFAULTS[r[0]]) || (r[0] === 'event_venue' && OLD_VENUES.indexOf(r[1]) !== -1)) {
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
