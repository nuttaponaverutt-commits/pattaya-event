// รายชื่อลูกค้าเป้าหมาย (แท็บ Customers), การจับคู่ลูกค้ากับ Sales และการตั้งค่าการลงทะเบียนจากหลังบ้าน

const CUSTOMER_FIELDS = ['mmid', 'cust_no', 'customer_name', 'customer_type', 'phone', 'contact_name',
  'sales_code', 'sales_name', 'store', 'region', 'spend_3m', 'suggested_tier', 'invited', 'tier', 'note', 'updated_at'];
const CUSTOMER_TEXT_COLS = ['mmid', 'cust_no', 'phone', 'sales_code'];
// วิธีจับคู่ที่ควรให้ Admin ตรวจ (จับจากชื่อ อาจผิดคนได้)
const WEAK_MATCH = ['name', 'company'];

// ---------- อ่าน / index ----------

function customerSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Customers');
  if (!sh) sh = ss.insertSheet('Customers');
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, CUSTOMER_FIELDS.length).setValues([CUSTOMER_FIELDS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readCustomers_() {
  const sh = sheet_('Customers');
  const out = { sh: sh, h: CUSTOMER_FIELDS.slice(), col: {}, rows: [] };
  if (!sh || sh.getLastRow() < 1) return out;
  const v = sh.getDataRange().getValues();
  out.h = v.shift().map(String);
  out.h.forEach(function (n, i) { out.col[n] = i; });
  v.forEach(function (row, i) {
    const r = { _row: i + 2 };
    out.h.forEach(function (n, j) { r[n] = row[j]; });
    if (!r.mmid && !r.cust_no) return;
    r.mmid = String(r.mmid || '');
    r.cust_no = String(r.cust_no || '');
    r.phone = String(r.phone || '');
    out.rows.push(r);
  });
  return out;
}

function custKey_(r) {
  const mk = mmidKey_(r.mmid);
  if (mk) return 'm:' + mk;
  const cn = custNoKey_(r.cust_no);
  return cn ? 'c:' + cn : '';
}

function custNoKey_(v) {
  return String(v || '').replace(/\D/g, '').replace(/^0+/, '');
}

// ชื่อคน: ตัดคำนำหน้าและช่องว่าง
function personKey_(s) {
  return String(s || '').trim()
    .replace(/^(นางสาว|นาย|นาง|น\.ส\.|คุณ|mr\.?|mrs\.?|ms\.?|miss)\s*/i, '')
    .replace(/\s+/g, '').toLowerCase();
}

// ชื่อนิติบุคคล: ตัดคำประเภทกิจการและเครื่องหมาย
function companyKey_(s) {
  return String(s || '').toLowerCase()
    .replace(/(บริษัท|บมจ\.?|บจก\.?|บจ\.?|ห้างหุ้นส่วนจำกัด|ห้างหุ้นส่วน|หจก\.?|\(มหาชน\)|มหาชน|จำกัด|ร้าน|co\.?,?\s*ltd\.?|company|limited)/g, '')
    .replace(/[\s.,()\-_'"]/g, '');
}

function customerIndex_() {
  const c = readCustomers_();
  const idx = { ready: c.rows.length > 0, byMmid: {}, byCustNo: {}, byPhone: {}, byPerson: {}, byCompany: {}, rows: c.rows };
  const addUnique = function (map, key, r) {
    if (!key || key.length < 3) return;
    map[key] = (key in map && map[key] !== r) ? null : r; // ชื่อซ้ำหลายราย = ไม่ใช้จับคู่
  };
  c.rows.forEach(function (r) {
    const mk = mmidKey_(r.mmid);
    if (mk) idx.byMmid[mk] = r;
    const cn = custNoKey_(r.cust_no);
    if (cn) idx.byCustNo[cn] = r;
    const pk = phoneKey_(r.phone);
    if (pk) idx.byPhone[pk] = r;
    if (r.customer_type === 'บุคคล') addUnique(idx.byPerson, personKey_(r.customer_name), r);
    else addUnique(idx.byCompany, companyKey_(r.customer_name), r);
    if (r.contact_name) addUnique(idx.byPerson, personKey_(r.contact_name), r);
  });
  return idx;
}

// จับคู่ผู้ลงทะเบียนกับรายชื่อลูกค้า: MMID → เลขลูกค้า → เบอร์ → ชื่อ-นามสกุล → ชื่อร้าน
function matchCustomer_(idx, f) {
  const none = { sales_name: '', match_method: 'none', cust_no: '', customer_name: '', store: '', cust_tier: '' };
  if (!idx.ready) {
    // ยังไม่มีรายชื่อลูกค้า ใช้ Sales_List แบบเดิม (ถ้าตั้งค่าไว้)
    const legacy = matchSales_(salesIndex_(getSettingsCached_()), f.mmid, f.phone);
    return Object.assign({}, none, legacy);
  }
  let r = null;
  let m = 'none';
  const mk = mmidKey_(f.mmid);
  if (mk && idx.byMmid[mk]) { r = idx.byMmid[mk]; m = 'mmid'; }
  if (!r && mk) {
    const digits = mk.replace(/\D/g, '');
    // ลูกค้ากรอกเลขลูกค้าแทน MMID หรือ MMID ใบอื่นที่มีเลขลูกค้าเดียวกัน (MMID = 0 + เลขลูกค้า + 5 หลัก)
    if (idx.byCustNo[digits]) { r = idx.byCustNo[digits]; m = 'custno'; }
    else if (digits.length >= 12) {
      const inner = digits.slice(0, digits.length - 5).replace(/^0+/, '');
      if (idx.byCustNo[inner]) { r = idx.byCustNo[inner]; m = 'custno'; }
    }
  }
  if (!r) { const pk = phoneKey_(f.phone); if (pk && idx.byPhone[pk]) { r = idx.byPhone[pk]; m = 'phone'; } }
  if (!r) { const nk = personKey_(f.full_name); if (nk.length >= 4 && idx.byPerson[nk]) { r = idx.byPerson[nk]; m = 'name'; } }
  if (!r) { const ck = companyKey_(f.company); if (ck.length >= 3 && idx.byCompany[ck]) { r = idx.byCompany[ck]; m = 'company'; } }
  if (!r) return none;
  return {
    sales_name: String(r.sales_name || ''),
    match_method: m,
    cust_no: r.cust_no,
    customer_name: String(r.customer_name || ''),
    store: String(r.store || ''),
    cust_tier: isTrue_(r.invited) && TIERS.indexOf(r.tier) !== -1 ? r.tier : ''
  };
}

// ---------- API: รายชื่อลูกค้า ----------

// นำเข้ารายชื่อ (หน้าเว็บรวมยอดต่อลูกค้ามาแล้ว) รวมกับของเดิมด้วย MMID/เลขลูกค้า
// ข้อมูลจากไฟล์ทับของเดิม ส่วน เชิญ/กลุ่ม/เบอร์/ผู้ติดต่อ/หมายเหตุ ทับเฉพาะเมื่อไฟล์มีค่า
function apiCustomersImport_(req) {
  const incoming = Array.isArray(req.rows) ? req.rows : [];
  if (!incoming.length) fail_('ไม่พบข้อมูลลูกค้าในไฟล์');
  if (incoming.length > 20000) fail_('ไฟล์ใหญ่เกินไป (เกิน 20,000 ราย)');
  return withLock_(function () {
    const sh = customerSheet_();
    const c = readCustomers_();
    const byKey = {};
    c.rows.forEach(function (r) { const k = custKey_(r); if (k) byKey[k] = r; });
    let added = 0, updated = 0, skipped = 0;
    const fileFields = ['mmid', 'cust_no', 'customer_name', 'customer_type', 'sales_code', 'sales_name', 'store', 'region', 'spend_3m', 'suggested_tier'];
    const keepFields = ['phone', 'contact_name', 'invited', 'tier', 'note'];
    incoming.forEach(function (o) {
      const rec = {
        mmid: clip_(o.mmid, 30), cust_no: clip_(o.cust_no, 20), customer_name: clip_(o.customer_name, 150),
        customer_type: clip_(o.customer_type, 30), phone: o.phone ? cleanPhone_(o.phone) : '',
        contact_name: clip_(o.contact_name, 100), sales_code: clip_(o.sales_code, 30), sales_name: clip_(o.sales_name, 100),
        store: clip_(o.store, 60), region: clip_(o.region, 30), spend_3m: Number(o.spend_3m) || 0,
        suggested_tier: TIERS.indexOf(o.suggested_tier) !== -1 ? o.suggested_tier : '',
        invited: o.invited === true || o.invited === false ? o.invited : '',
        tier: TIERS.indexOf(o.tier) !== -1 ? o.tier : '', note: clip_(o.note, 300)
      };
      const k = custKey_(rec);
      if (!k) { skipped++; return; }
      const ex = byKey[k];
      if (ex) {
        fileFields.forEach(function (f) { if (rec[f] !== '' && rec[f] !== 0) ex[f] = rec[f]; });
        keepFields.forEach(function (f) { if (rec[f] !== '') ex[f] = rec[f]; });
        ex.updated_at = new Date();
        updated++;
      } else {
        rec.invited = rec.invited === '' ? false : rec.invited;
        rec.updated_at = new Date();
        byKey[k] = rec;
        c.rows.push(rec);
        added++;
      }
    });
    writeCustomers_(sh, c.rows);
    return { ok: true, added: added, updated: updated, skipped: skipped, total: c.rows.length };
  });
}

function writeCustomers_(sh, rows) {
  const n = rows.length;
  const need = n + 1;
  if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows());
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, CUSTOMER_FIELDS.length).clearContent();
  sh.getRange(1, 1, 1, CUSTOMER_FIELDS.length).setValues([CUSTOMER_FIELDS]).setFontWeight('bold');
  if (!n) return;
  CUSTOMER_TEXT_COLS.forEach(function (f) {
    sh.getRange(2, CUSTOMER_FIELDS.indexOf(f) + 1, n, 1).setNumberFormat('@');
  });
  sh.getRange(2, 1, n, CUSTOMER_FIELDS.length).setValues(rows.map(function (r) {
    return CUSTOMER_FIELDS.map(function (f) { return safe_(r[f] === undefined || r[f] === null ? '' : r[f]); });
  }));
}

// รายชื่อลูกค้าพร้อมสถานะ ยังไม่ลงทะเบียน / ลงทะเบียนแล้ว / มาแล้ว
function apiCustomers_() {
  const c = readCustomers_();
  const regs = readRegs_().records;
  const byCust = {};
  regs.forEach(function (r) {
    const k = custNoKey_(r.cust_no);
    if (k && (!byCust[k] || r.status === STATUS_IN)) byCust[k] = r;
  });
  const rows = c.rows.map(function (r) {
    const reg = byCust[custNoKey_(r.cust_no)];
    return {
      key: custKey_(r), mmid: r.mmid, cust_no: r.cust_no, customer_name: r.customer_name, customer_type: r.customer_type,
      phone: r.phone, contact_name: r.contact_name, sales_name: r.sales_name, store: r.store, region: r.region,
      spend_3m: Number(r.spend_3m) || 0, suggested_tier: r.suggested_tier, invited: isTrue_(r.invited), tier: r.tier || '',
      note: r.note, status: reg ? (reg.status === STATUS_IN ? 'มาแล้ว' : 'ลงทะเบียนแล้ว') : 'ยังไม่ลงทะเบียน',
      reg_name: reg ? reg.full_name : ''
    };
  });
  return { ok: true, customers: rows };
}

function findCustomer_(c, key) {
  return c.rows.find(function (r) { return custKey_(r) === key; }) || null;
}

function apiCustomerUpdate_(req) {
  const fields = req.fields || {};
  return withLock_(function () {
    const c = readCustomers_();
    const r = findCustomer_(c, String(req.key || ''));
    if (!r) return { ok: false, error: 'ไม่พบลูกค้ารายนี้ อาจถูกนำเข้าใหม่ไปแล้ว กรุณารีเฟรช' };
    const upd = {};
    if ('invited' in fields) upd.invited = fields.invited === true;
    if ('tier' in fields) {
      if (fields.tier && TIERS.indexOf(fields.tier) === -1) fail_('กลุ่มไม่ถูกต้อง');
      upd.tier = fields.tier || '';
    }
    if ('phone' in fields) {
      upd.phone = fields.phone ? cleanPhone_(fields.phone) : '';
      if (upd.phone && !/^0\d{9}$/.test(upd.phone)) fail_('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
    }
    if ('contact_name' in fields) upd.contact_name = clip_(fields.contact_name, 100);
    if ('sales_name' in fields) upd.sales_name = clip_(fields.sales_name, 100);
    if ('note' in fields) upd.note = clip_(fields.note, 300);
    upd.updated_at = new Date();
    Object.keys(upd).forEach(function (k) {
      if (c.col[k] === undefined) return;
      if (CUSTOMER_TEXT_COLS.indexOf(k) !== -1) c.sh.getRange(r._row, c.col[k] + 1).setNumberFormat('@');
      c.sh.getRange(r._row, c.col[k] + 1).setValue(safe_(upd[k]));
    });
    return { ok: true };
  });
}

// ทำทีละหลายราย: เชิญตามกลุ่มที่แนะนำ หรือตั้งค่า เชิญ/กลุ่ม ให้รายการที่เลือก
function apiCustomersBulk_(req) {
  return withLock_(function () {
    const c = readCustomers_();
    let changed = 0;
    const keys = Array.isArray(req.keys) ? req.keys : null;
    const set = {};
    keys && keys.forEach(function (k) { set[k] = true; });
    c.rows.forEach(function (r) {
      if (req.apply_suggested) {
        if (TIERS.indexOf(r.suggested_tier) !== -1 && r.suggested_tier !== 'Walk-in' && !isTrue_(r.invited)) {
          r.invited = true; r.tier = r.suggested_tier; r.updated_at = new Date(); changed++;
        }
      } else if (set[custKey_(r)]) {
        const f = req.fields || {};
        if ('invited' in f) r.invited = f.invited === true;
        if ('tier' in f && (f.tier === '' || TIERS.indexOf(f.tier) !== -1)) r.tier = f.tier;
        r.updated_at = new Date();
        changed++;
      }
    });
    writeCustomers_(c.sh, c.rows);
    return { ok: true, changed: changed };
  });
}

// ---------- API: ตั้งค่าการลงทะเบียน ----------

const EDITABLE_SETTINGS = ['registration_open', 'max_capacity', 'msg_full_title', 'msg_full_body', 'msg_closed_title', 'msg_closed_body'];

function apiSettingsGet_() {
  const s = getSettings_();
  const out = { ok: true, count: countRegistrations_() };
  EDITABLE_SETTINGS.forEach(function (k) { out[k] = k === 'registration_open' ? isTrue_(s[k]) : (s[k] === undefined ? '' : s[k]); });
  return out;
}

function apiSettingsUpdate_(req) {
  const fields = req.fields || {};
  return withLock_(function () {
    const sh = sheet_('Settings');
    const v = sh.getDataRange().getValues();
    Object.keys(fields).forEach(function (k) {
      if (EDITABLE_SETTINGS.indexOf(k) === -1) return;
      let val = fields[k];
      if (k === 'registration_open') val = val === true;
      else if (k === 'max_capacity') {
        val = Math.floor(Number(val));
        if (!(val > 0) || val > 100000) fail_('จำนวนรับสูงสุดต้องเป็นตัวเลขมากกว่า 0');
      } else val = clip_(val, 2000);
      const i = v.findIndex(function (r, j) { return j > 0 && String(r[0]).trim() === k; });
      if (i > 0) sh.getRange(i + 1, 2).setValue(typeof val === 'string' ? safe_(val) : val);
      else sh.appendRow([k, typeof val === 'string' ? safe_(val) : val, '']);
    });
    clearConfigCache_();
    return apiSettingsGet_();
  });
}

function clearConfigCache_() {
  try {
    CacheService.getScriptCache().removeAll(['settings', 'reg_count'].concat(TIERS.map(function (t) { return 'cfg_' + t; })));
  } catch (e) {}
}

// ---------- สรุปราย Sales / สาขา ----------

function salesAndStoreSummary_(regs) {
  const c = readCustomers_();
  const NONE = 'ไม่มี Sales';
  const sales = {};
  const stores = {};
  const touch = function (map, name) {
    return map[name] || (map[name] = { name: name, in_list: 0, invited: 0, registered: 0, attended: 0 });
  };
  c.rows.forEach(function (r) {
    const s = touch(sales, String(r.sales_name || NONE));
    s.in_list++;
    if (isTrue_(r.invited)) s.invited++;
    if (r.store) {
      const st = touch(stores, String(r.store));
      st.in_list++;
      if (isTrue_(r.invited)) st.invited++;
    }
  });
  regs.forEach(function (r) {
    const isIn = r.status === STATUS_IN;
    const s = touch(sales, String(r.sales_name || NONE));
    s.registered++;
    if (isIn) s.attended++;
    const st = touch(stores, String(r.store || 'ไม่ทราบสาขา'));
    st.registered++;
    if (isIn) st.attended++;
  });
  const sort = function (map) {
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return (b.registered - a.registered) || (b.invited - a.invited) || (b.in_list - a.in_list);
    });
  };
  return { sales: sort(sales), stores: sort(stores), has_customers: c.rows.length > 0 };
}
