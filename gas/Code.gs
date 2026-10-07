const SHEETS = {
  Registrations: [
    'reg_id', 'created_at', 'source', 'full_name', 'phone', 'mmid', 'company',
    'age_20_confirmed', 'pdpa_consent', 'sales_name', 'match_method', 'status',
    'checked_in_at', 'checked_in_by', 'note'
  ],
  Sales_List: [],
  Checkin_Log: ['timestamp', 'reg_id', 'full_name', 'result', 'scanned_by', 'device'],
  Settings: ['key', 'value', 'description']
};

const DEFAULT_SETTINGS = [
  ['event_name', 'Pattaya Event', 'ชื่องาน'],
  ['event_date', '', 'วันที่จัดงาน'],
  ['event_venue', 'Pattaya', 'สถานที่จัดงาน'],
  ['registration_open', true, 'TRUE = เปิดรับลงทะเบียน, FALSE = ปิด'],
  ['max_capacity', 800, 'จำนวนผู้เข้างานสูงสุด'],
  ['sales_col_mmid', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บ MMID'],
  ['sales_col_phone', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บเบอร์โทร'],
  ['sales_col_sales_name', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บชื่อเซลส์'],
  ['sales_col_customer_name', '', 'ชื่อหัวคอลัมน์ใน Sales_List ที่เก็บชื่อลูกค้า']
];

// รันครั้งเดียวจาก Apps Script editor (รันซ้ำได้ ไม่ทับข้อมูลเดิม)
function setup() {
  const ss = SpreadsheetApp.getActive();

  Object.keys(SHEETS).forEach(function (name) {
    const headers = SHEETS[name];
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (headers.length && sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });

  // phone และ mmid เป็น text เพื่อไม่ให้เลข 0 นำหน้าหาย
  const reg = ss.getSheetByName('Registrations');
  ['phone', 'mmid'].forEach(function (col) {
    const idx = SHEETS.Registrations.indexOf(col) + 1;
    reg.getRange(1, idx, reg.getMaxRows(), 1).setNumberFormat('@');
  });

  const settings = ss.getSheetByName('Settings');
  const existingKeys = settings.getLastRow() > 1
    ? settings.getRange(2, 1, settings.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; })
    : [];
  const newRows = DEFAULT_SETTINGS.filter(function (r) { return existingKeys.indexOf(r[0]) === -1; });
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

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
