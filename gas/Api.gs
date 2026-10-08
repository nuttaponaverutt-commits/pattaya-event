// API สำหรับหน้าเว็บใน docs/ เรียกด้วย fetch POST (Content-Type: text/plain) body = JSON {action, ...}
// ตอบกลับ JSON เสมอ: {ok:true, ...} หรือ {ok:false, error:'ข้อความภาษาไทย'}

const STATUS_PENDING = 'ยังไม่มา';
const STATUS_IN = 'มาแล้ว';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const TZ = 'Asia/Bangkok';
// กลุ่มลูกค้า เรียงจากสูงไปต่ำ (ใช้ตัดสินตอนลงทะเบียนซ้ำด้วยลิงก์กลุ่มที่สูงกว่า)
const TIERS = ['VVIP', 'VIP', 'Walk-in'];

const PUBLIC_ACTIONS = {
  config: apiConfig_,
  register: apiRegister_,
  lookup: apiLookup_,
  login: apiLogin_
};
// staff และ admin ใช้ได้
const STAFF_ACTIONS = {
  logout: apiLogout_,
  scan: apiScan_,
  checkin: apiCheckin_,
  search: apiSearch_,
  staff_register: apiStaffRegister_
};
// admin เท่านั้น
const ADMIN_ACTIONS = {
  dashboard: apiDashboard_,
  list: apiList_,
  update: apiUpdate_,
  delete: apiDelete_,
  rematch: apiRematch_,
  sales_names: apiSalesNames_,
  links: apiLinks_,
  draw: apiDraw_,
  draw_list: apiDrawList_,
  draw_void: apiDrawVoid_
};

function doPost(e) {
  let res;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    res = handle_(req);
  } catch (err) {
    if (!err.userMessage) console.error(err && err.stack || err);
    res = { ok: false, error: err.userMessage || 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' };
  }
  return json_(res);
}

function handle_(req) {
  const action = req && req.action;
  if (PUBLIC_ACTIONS[action]) return PUBLIC_ACTIONS[action](req);

  const sess = verifyToken_(req.token);
  if (!sess) return { ok: false, auth: false, error: 'กรุณาเข้าสู่ระบบใหม่' };
  if (STAFF_ACTIONS[action]) return STAFF_ACTIONS[action](req, sess);
  if (ADMIN_ACTIONS[action]) {
    if (sess.role !== 'admin') return { ok: false, auth: false, error: 'ไม่มีสิทธิ์ใช้งานส่วนนี้' };
    return ADMIN_ACTIONS[action](req, sess);
  }
  return { ok: false, error: 'ไม่รู้จักคำสั่งนี้' };
}

// ---------- Public ----------

function apiConfig_(req) {
  const s = getSettings_();
  const count = countRegistrations_();
  const state = onlineState_(s, count);
  return {
    ok: true,
    event_name: String(s.event_name || ''),
    event_date: s.event_date instanceof Date ? fmt_(s.event_date, 'yyyy-MM-dd') : String(s.event_date || ''),
    event_time: String(s.event_time || ''),
    event_venue: String(s.event_venue || ''),
    tier: tierFromCode_(s, req && req.inv),
    registration_open: state.open,
    closed_reason: state.reason
  };
}

function apiRegister_(req) {
  const f = validateForm_(req);
  const source = req.src === 'walkin' ? 'Walk-in' : 'Online';
  const tier = tierFromCode_(getSettings_(), req.inv);
  const r = withLock_(function () { return createRegistration_(f, source, tier); });
  return { ok: true, existing: r.existing, reg_id: r.rec.reg_id, full_name: r.rec.full_name, tier: r.rec.tier };
}

function apiLookup_(req) {
  const key = phoneKey_(cleanPhone_(req.phone));
  if (!key) return { ok: false, error: 'กรุณากรอกเบอร์โทร 10 หลัก' };
  const t = readRegs_();
  const hit = t.records.find(function (r) { return phoneKey_(r.phone) === key; });
  if (!hit) return { ok: false, error: 'ไม่พบการลงทะเบียนของเบอร์นี้' };
  return { ok: true, reg_id: hit.reg_id, full_name: hit.full_name, tier: hit.tier };
}

function apiLogin_(req) {
  const role = req.role === 'admin' ? 'admin' : 'staff';
  const props = PropertiesService.getScriptProperties();
  const pass = props.getProperty(role === 'admin' ? 'ADMIN_PASS' : 'STAFF_PASS');
  if (!pass || String(req.password || '') !== pass) {
    Utilities.sleep(1000); // ชะลอการเดารหัส
    return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
  }
  const station = clip_(req.station, 40) || (role === 'admin' ? 'Admin' : 'Staff');
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const sess = { role: role, station: station, exp: Date.now() + TOKEN_TTL_MS, pv: hash_(pass) };
  cleanupTokens_(props);
  props.setProperty('tok_' + token, JSON.stringify(sess));
  return { ok: true, token: token, role: role, station: station, expires_at: sess.exp };
}

// ---------- Staff ----------

function apiLogout_(req) {
  PropertiesService.getScriptProperties().deleteProperty('tok_' + req.token);
  return { ok: true };
}

// ดูข้อมูลจาก QR ก่อนกด Confirm (ยังไม่เช็คอิน)
function apiScan_(req, sess) {
  const id = normId_(req.reg_id);
  const t = readRegs_();
  const rec = t.byId[id];
  if (!rec) {
    logCheckin_(id, '', 'not_found', sess, req.device);
    return { ok: true, result: 'not_found', reg_id: id };
  }
  if (rec.status === STATUS_IN) {
    logCheckin_(id, rec.full_name, 'duplicate', sess, req.device);
    return { ok: true, result: 'duplicate', person: pub_(rec) };
  }
  return { ok: true, result: 'found', person: pub_(rec) };
}

function apiCheckin_(req, sess) {
  const id = normId_(req.reg_id);
  return withLock_(function () { return checkinById_(id, sess, req.device); });
}

function apiSearch_(req) {
  const q = String(req.q || '').trim().toLowerCase();
  if (q.length < 2) return { ok: false, error: 'กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร' };
  const digits = q.replace(/\D/g, '');
  const qMmid = mmidKey_(q);
  const results = readRegs_().records.filter(function (r) {
    if (digits.length >= 4 && String(r.phone).indexOf(digits) !== -1) return true;
    if (String(r.full_name).toLowerCase().indexOf(q) !== -1) return true;
    if (String(r.company).toLowerCase().indexOf(q) !== -1) return true;
    return qMmid && mmidKey_(r.mmid) === qMmid;
  }).slice(0, 20).map(pub_);
  return { ok: true, results: results };
}

// staff ลงทะเบียนแทนแล้วเช็คอินทันที (ไม่สนว่าปิดรับออนไลน์หรือเต็มแล้ว)
function apiStaffRegister_(req, sess) {
  const f = validateForm_(req);
  const tier = TIERS.indexOf(req.tier) !== -1 ? req.tier : 'Walk-in';
  return withLock_(function () {
    const r = createRegistration_(f, 'Staff', tier);
    const c = checkinById_(r.rec.reg_id, sess, req.device);
    c.existing = r.existing;
    return c;
  });
}

// ---------- Admin ----------

function apiDashboard_() {
  const t = readRegs_();
  const recs = t.records;
  const s = getSettings_();
  const idx = salesIndex_(s);

  const bySource = { 'Online': 0, 'Walk-in': 0, 'Staff': 0 };
  const targets = { 'VVIP': s.target_vvip, 'VIP': s.target_vip, 'Walk-in': s.target_walkin };
  const byTier = {};
  TIERS.forEach(function (t) { byTier[t] = { registered: 0, attended: 0, target: Number(targets[t]) || 0 }; });
  const salesMap = {};
  idx.names.forEach(function (n) { salesMap[n] = { sales_name: n, in_list: idx.counts[n], registered: 0, attended: 0 }; });
  const NONE = 'ไม่มี Sales';
  let attended = 0;

  recs.forEach(function (r) {
    if (bySource[r.source] !== undefined) bySource[r.source]++;
    const isIn = r.status === STATUS_IN;
    if (isIn) attended++;
    const t = byTier[r.tier] || byTier['Walk-in'];
    t.registered++;
    if (isIn) t.attended++;
    const name = r.sales_name || NONE;
    if (!salesMap[name]) salesMap[name] = { sales_name: name, in_list: 0, registered: 0, attended: 0 };
    salesMap[name].registered++;
    if (isIn) salesMap[name].attended++;
  });

  const recent = recs
    .filter(function (r) { return r.status === STATUS_IN && r.checked_in_at instanceof Date; })
    .sort(function (a, b) { return b.checked_in_at - a.checked_in_at; })
    .slice(0, 20)
    .map(pub_);

  const total = recs.length;
  return {
    ok: true,
    total: total,
    attended: attended,
    pending: total - attended,
    attend_pct: total ? Math.round(attended * 1000 / total) / 10 : 0,
    by_source: bySource,
    by_tier: byTier,
    recent: recent,
    sales_summary: Object.keys(salesMap).map(function (k) { return salesMap[k]; })
      .sort(function (a, b) { return (a.sales_name === NONE) - (b.sales_name === NONE) || b.registered - a.registered; }),
    max_capacity: Number(s.max_capacity) || 0,
    registration_open: onlineState_(s, total).open,
    sheet_url: SpreadsheetApp.getActive().getUrl(),
    updated_at: fmt_(new Date(), 'HH:mm:ss')
  };
}

function apiList_() {
  return { ok: true, records: readRegs_().records.map(full_) };
}

function apiUpdate_(req, sess) {
  const id = normId_(req.reg_id);
  const fields = req.fields || {};
  return withLock_(function () {
    const t = readRegs_();
    const rec = t.byId[id];
    if (!rec) return { ok: false, error: 'ไม่พบรายการนี้ อาจถูกลบไปแล้ว' };
    const upd = {};

    if ('full_name' in fields) {
      upd.full_name = clip_(fields.full_name, 100).replace(/\s+/g, ' ');
      if (!upd.full_name) fail_('ชื่อ-นามสกุลห้ามว่าง');
    }
    if ('phone' in fields) {
      upd.phone = cleanPhone_(fields.phone);
      if (!/^0\d{9}$/.test(upd.phone)) fail_('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
    }
    if ('mmid' in fields) upd.mmid = clip_(fields.mmid, 30);
    if ('tier' in fields) {
      if (TIERS.indexOf(fields.tier) === -1) fail_('กลุ่มไม่ถูกต้อง');
      upd.tier = fields.tier;
    }
    if ('company' in fields) upd.company = clip_(fields.company, 100);
    if ('note' in fields) upd.note = clip_(fields.note, 300);
    if ('sales_name' in fields) {
      upd.sales_name = clip_(fields.sales_name, 100);
      upd.match_method = upd.sales_name ? 'manual' : 'none';
    }
    if ('status' in fields) {
      if (fields.status === STATUS_IN && rec.status !== STATUS_IN) {
        upd.status = STATUS_IN;
        upd.checked_in_at = new Date();
        upd.checked_in_by = sess.station;
      } else if (fields.status === STATUS_PENDING && rec.status !== STATUS_PENDING) {
        upd.status = STATUS_PENDING;
        upd.checked_in_at = '';
        upd.checked_in_by = '';
      }
    }

    if (upd.phone || upd.mmid) {
      const dup = findDuplicate_(t, upd.phone || rec.phone, 'mmid' in upd ? upd.mmid : rec.mmid, id);
      if (dup) fail_('เบอร์โทรหรือ MMID ซ้ำกับ ' + dup.full_name + ' (' + dup.reg_id + ')');
    }

    writeFields_(t, rec, upd);
    if (upd.status === STATUS_IN) logCheckin_(id, upd.full_name || rec.full_name, 'ok', sess, 'admin');
    Object.keys(upd).forEach(function (k) { rec[k] = upd[k]; });
    return { ok: true, record: full_(rec) };
  });
}

function apiDelete_(req) {
  const id = normId_(req.reg_id);
  return withLock_(function () {
    const t = readRegs_();
    const rec = t.byId[id];
    if (!rec) return { ok: false, error: 'ไม่พบรายการนี้ อาจถูกลบไปแล้ว' };
    t.sh.deleteRow(rec._row);
    return { ok: true };
  });
}

// match ย้อนหลังเฉพาะแถวที่ยังไม่มี Sales และไม่ใช่ manual
function apiRematch_() {
  return withLock_(function () {
    const s = getSettings_();
    const idx = salesIndex_(s);
    if (!idx.ready) fail_('ยังตั้งค่าชื่อคอลัมน์ Sales ใน Settings ไม่ครบ หรือ Sales_List ยังว่าง');
    const t = readRegs_();
    let matched = 0;
    let checked = 0;
    t.records.forEach(function (r) {
      if (r.match_method === 'manual' || r.sales_name) return;
      checked++;
      const m = matchSales_(idx, r.mmid, r.phone);
      if (m.sales_name) {
        writeFields_(t, r, m);
        matched++;
      } else if (r.match_method !== 'none') {
        writeFields_(t, r, { match_method: 'none' });
      }
    });
    return { ok: true, checked: checked, matched: matched };
  });
}

function apiSalesNames_() {
  return { ok: true, names: salesIndex_(getSettings_()).names };
}

// รหัสลิงก์เชิญของแต่ละกลุ่ม ให้หน้า Admin สร้างลิงก์
function apiLinks_() {
  const s = getSettings_();
  return { ok: true, vvip: String(s.invite_code_vvip || ''), vip: String(s.invite_code_vip || '') };
}

// ---------- Lucky Draw ----------

// สุ่มจากผู้ที่เช็คอินแล้วและยังไม่เคยถูกสุ่ม (รวมคนที่สละสิทธิ์) สุ่มฝั่ง server
function apiDraw_(req, sess) {
  const tier = String(req.tier || '');
  if (tier && TIERS.indexOf(tier) === -1) fail_('กลุ่มไม่ถูกต้อง');
  const round = clip_(req.round, 40) || 'Lucky Draw';
  return withLock_(function () {
    const log = sheet_('Lucky_Draw');
    if (!log) fail_('ยังไม่มีแท็บ Lucky_Draw กรุณารัน setup ใน Apps Script อีกครั้ง');
    const drawn = {};
    log.getDataRange().getValues().slice(1).forEach(function (r) { if (r[3]) drawn[r[3]] = true; });
    const pool = readRegs_().records.filter(function (r) {
      return r.status === STATUS_IN && !drawn[r.reg_id] && (!tier || (r.tier || 'Walk-in') === tier);
    });
    if (!pool.length) return { ok: false, error: 'ไม่มีผู้มีสิทธิ์ลุ้นในกลุ่มนี้แล้ว (ต้องเช็คอินแล้ว และยังไม่เคยถูกสุ่ม)' };
    const w = pool[randomInt_(pool.length)];
    log.appendRow([new Date(), safe_(round), w.tier || 'Walk-in', w.reg_id, safe_(w.full_name), 'won', safe_(sess.station)]);
    const names = [];
    for (let i = 0; i < Math.min(60, pool.length); i++) names.push(pool[randomInt_(pool.length)].full_name);
    return { ok: true, winner: drawPub_(w), pool_size: pool.length, names: names };
  });
}

function apiDrawList_() {
  const log = sheet_('Lucky_Draw');
  if (!log) return { ok: true, winners: [] };
  const regs = readRegs_().byId;
  const winners = log.getDataRange().getValues().slice(1).filter(function (r) { return r[3]; }).map(function (r) {
    const rec = regs[r[3]];
    return {
      time: fmt_(r[0], 'HH:mm'), round: r[1], tier: r[2], reg_id: r[3], full_name: r[4], status: r[5],
      company: rec ? rec.company : '', phone_tail: rec ? String(rec.phone).slice(-4) : ''
    };
  }).reverse();
  return { ok: true, winners: winners };
}

// ผู้โชคดีไม่อยู่ในงาน: เปลี่ยนสถานะเป็นสละสิทธิ์ (ยังถูกตัดออกจากการสุ่มรอบต่อไป)
function apiDrawVoid_(req) {
  const id = normId_(req.reg_id);
  return withLock_(function () {
    const log = sheet_('Lucky_Draw');
    const v = log.getDataRange().getValues();
    for (let i = v.length - 1; i >= 1; i--) {
      if (v[i][3] === id && v[i][5] === 'won') {
        log.getRange(i + 1, 6).setValue('void');
        return { ok: true };
      }
    }
    return { ok: false, error: 'ไม่พบรายชื่อผู้โชคดีนี้' };
  });
}

function drawPub_(r) {
  return { reg_id: r.reg_id, full_name: r.full_name, company: r.company, tier: r.tier || 'Walk-in', phone_tail: String(r.phone).slice(-4) };
}

function randomInt_(n) {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  const x = ((b[0] & 255) * 16777216) + ((b[1] & 255) << 16) + ((b[2] & 255) << 8) + (b[3] & 255);
  return x % n;
}

function tierFromCode_(s, code) {
  const c = String(code || '').trim().toLowerCase();
  if (c && c === String(s.invite_code_vvip || '').toLowerCase()) return 'VVIP';
  if (c && c === String(s.invite_code_vip || '').toLowerCase()) return 'VIP';
  return 'Walk-in';
}

// ---------- Core ----------

function createRegistration_(f, source, tier) {
  const t = readRegs_();
  const dup = findDuplicate_(t, f.phone, f.mmid, null);
  if (dup) {
    // ลงซ้ำด้วยลิงก์กลุ่มที่สูงกว่า ให้ยกระดับกลุ่ม ไม่ลดระดับ
    const cur = TIERS.indexOf(dup.tier) === -1 ? TIERS.length - 1 : TIERS.indexOf(dup.tier);
    if (TIERS.indexOf(tier) !== -1 && TIERS.indexOf(tier) < cur) {
      writeFields_(t, dup, { tier: tier });
      dup.tier = tier;
    }
    return { existing: true, rec: dup };
  }

  const s = getSettings_();
  if (source !== 'Staff') {
    const state = onlineState_(s, t.records.length);
    if (!state.open) fail_(state.reason);
  }
  const m = matchSales_(salesIndex_(s), f.mmid, f.phone);
  const rec = {
    reg_id: newRegId_(t),
    created_at: new Date(),
    source: source,
    full_name: f.full_name,
    phone: f.phone,
    mmid: f.mmid,
    company: f.company,
    age_20_confirmed: true,
    pdpa_consent: true,
    sales_name: m.sales_name,
    match_method: m.match_method,
    status: STATUS_PENDING,
    checked_in_at: '',
    checked_in_by: '',
    note: '',
    tier: TIERS.indexOf(tier) !== -1 ? tier : 'Walk-in'
  };
  appendRecord_(t, rec);
  return { existing: false, rec: rec };
}

function checkinById_(id, sess, device) {
  const t = readRegs_();
  const rec = t.byId[id];
  if (!rec) {
    logCheckin_(id, '', 'not_found', sess, device);
    return { ok: true, result: 'not_found', reg_id: id };
  }
  if (rec.status === STATUS_IN) {
    logCheckin_(id, rec.full_name, 'duplicate', sess, device);
    return { ok: true, result: 'duplicate', person: pub_(rec) };
  }
  const upd = { status: STATUS_IN, checked_in_at: new Date(), checked_in_by: sess.station };
  writeFields_(t, rec, upd);
  Object.keys(upd).forEach(function (k) { rec[k] = upd[k]; });
  logCheckin_(id, rec.full_name, 'ok', sess, device);
  return { ok: true, result: 'ok', person: pub_(rec) };
}

function validateForm_(req) {
  const f = {
    full_name: clip_(req.full_name, 100).replace(/\s+/g, ' '),
    phone: cleanPhone_(req.phone),
    mmid: clip_(req.mmid, 30),
    company: clip_(req.company, 100)
  };
  if (!f.full_name) fail_('กรุณากรอกชื่อ-นามสกุล');
  if (!/^0\d{9}$/.test(f.phone)) fail_('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  if (req.age20 !== true) fail_('กรุณายืนยันว่ามีอายุ 20 ปีขึ้นไป');
  if (req.pdpa !== true) fail_('กรุณายินยอมให้เก็บข้อมูลส่วนบุคคล');
  return f;
}

function onlineState_(s, count) {
  if (!isTrue_(s.registration_open)) return { open: false, reason: 'ปิดรับลงทะเบียนออนไลน์แล้ว' };
  const max = Number(s.max_capacity) || 0;
  if (max && count >= max) return { open: false, reason: 'จำนวนผู้ลงทะเบียนครบแล้ว' };
  return { open: true, reason: '' };
}

function findDuplicate_(t, phone, mmid, exceptId) {
  const pk = phoneKey_(phone);
  const mk = mmidKey_(mmid);
  return t.records.find(function (r) {
    if (r.reg_id === exceptId) return false;
    return (pk && phoneKey_(r.phone) === pk) || (mk && mmidKey_(r.mmid) === mk);
  }) || null;
}

// ---------- Sales matching ----------

function salesIndex_(s) {
  const idx = { ready: false, byMmid: {}, byPhone: {}, counts: {}, names: [] };
  const v = sheet_('Sales_List').getDataRange().getValues();
  if (v.length < 2) return idx;
  const h = v[0].map(function (x) { return String(x).trim(); });
  const col = function (key) {
    const name = String(s[key] || '').trim();
    return name ? h.indexOf(name) : -1;
  };
  const cs = col('sales_col_sales_name');
  const cm = col('sales_col_mmid');
  const cp = col('sales_col_phone');
  if (cs < 0 || (cm < 0 && cp < 0)) return idx;

  v.slice(1).forEach(function (r) {
    const sales = String(r[cs] || '').trim();
    if (!sales) return;
    idx.counts[sales] = (idx.counts[sales] || 0) + 1;
    if (cm >= 0) {
      const k = mmidKey_(r[cm]);
      if (k && !idx.byMmid[k]) idx.byMmid[k] = sales;
    }
    if (cp >= 0) {
      const k = phoneKey_(r[cp]);
      if (k && !idx.byPhone[k]) idx.byPhone[k] = sales;
    }
  });
  idx.names = Object.keys(idx.counts).sort();
  idx.ready = true;
  return idx;
}

function matchSales_(idx, mmid, phone) {
  const km = mmidKey_(mmid);
  if (km && idx.byMmid[km]) return { sales_name: idx.byMmid[km], match_method: 'mmid' };
  const kp = phoneKey_(phone);
  if (kp && idx.byPhone[kp]) return { sales_name: idx.byPhone[kp], match_method: 'phone' };
  return { sales_name: '', match_method: 'none' };
}

// ---------- Sheet helpers ----------

function sheet_(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function readRegs_() {
  const sh = sheet_('Registrations');
  const v = sh.getDataRange().getValues();
  const h = v.shift().map(String);
  const col = {};
  h.forEach(function (name, i) { col[name] = i; });
  const records = [];
  const byId = {};
  v.forEach(function (row, i) {
    if (!row[col.reg_id]) return;
    const rec = { _row: i + 2 };
    h.forEach(function (name, j) { rec[name] = row[j]; });
    rec.phone = String(rec.phone);
    rec.mmid = String(rec.mmid);
    records.push(rec);
    byId[rec.reg_id] = rec;
  });
  return { sh: sh, h: h, col: col, records: records, byId: byId };
}

function countRegistrations_() {
  return readRegs_().records.length;
}

function appendRecord_(t, rec) {
  const row = t.sh.getLastRow() + 1;
  const range = t.sh.getRange(row, 1, 1, t.h.length);
  t.sh.getRange(row, t.col.phone + 1).setNumberFormat('@');
  t.sh.getRange(row, t.col.mmid + 1).setNumberFormat('@');
  range.setValues([t.h.map(function (name) { return safe_(rec[name]); })]);
  rec._row = row;
  t.records.push(rec);
  t.byId[rec.reg_id] = rec;
}

function writeFields_(t, rec, upd) {
  Object.keys(upd).forEach(function (k) {
    if (t.col[k] === undefined) return;
    t.sh.getRange(rec._row, t.col[k] + 1).setValue(safe_(upd[k]));
  });
}

function logCheckin_(regId, name, result, sess, device) {
  sheet_('Checkin_Log').appendRow([
    new Date(), safe_(regId), safe_(name), result, safe_(sess.station), safe_(clip_(device, 80))
  ]);
}

function getSettings_() {
  const v = sheet_('Settings').getDataRange().getValues();
  const s = {};
  v.slice(1).forEach(function (r) { if (r[0]) s[String(r[0]).trim()] = r[1]; });
  return s;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_('ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ---------- Auth helpers ----------

function verifyToken_(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('tok_' + token);
  if (!raw) return null;
  const sess = JSON.parse(raw);
  const pass = props.getProperty(sess.role === 'admin' ? 'ADMIN_PASS' : 'STAFF_PASS');
  // หมดอายุ หรือรหัสถูกเปลี่ยนหลังล็อกอิน
  if (sess.exp < Date.now() || !pass || hash_(pass) !== sess.pv) {
    props.deleteProperty('tok_' + token);
    return null;
  }
  return sess;
}

function cleanupTokens_(props) {
  const all = props.getProperties();
  const now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('tok_') !== 0) return;
    try {
      if (JSON.parse(all[k]).exp < now) props.deleteProperty(k);
    } catch (e) {
      props.deleteProperty(k);
    }
  });
}

function hash_(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s));
}

// ---------- Value helpers ----------

// reg_id สุ่ม 10 ตัว (ตัด 0/O/1/I ที่สับสนง่าย) เดาไม่ได้
function newRegId_(t) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do {
    const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid());
    id = 'PE';
    for (let i = 0; i < 10; i++) id += A[(b[i] + 256) % 32];
  } while (t.byId[id]);
  return id;
}

function normId_(v) {
  return String(v || '').trim().toUpperCase().slice(0, 40);
}

function cleanPhone_(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 11 && d.indexOf('66') === 0) d = '0' + d.slice(2);
  if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d;
  return d;
}

// เทียบเบอร์ด้วย 9 หลักท้าย
function phoneKey_(p) {
  const d = String(p || '').replace(/\D/g, '');
  return d.length >= 9 ? d.slice(-9) : '';
}

// MMID: ตัดช่องว่าง ขีด จุด และศูนย์นำหน้า
function mmidKey_(m) {
  return String(m || '').replace(/[\s\-.]/g, '').replace(/^0+/, '').toUpperCase();
}

function clip_(v, n) {
  return String(v == null ? '' : v).trim().slice(0, n);
}

function isTrue_(v) {
  return v === true || String(v).trim().toUpperCase() === 'TRUE';
}

// กันข้อความที่ขึ้นต้นด้วย = + - @ ถูกตีความเป็นสูตรใน Sheet
function safe_(v) {
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function fmt_(d, pattern) {
  return d instanceof Date ? Utilities.formatDate(d, TZ, pattern) : '';
}

// ข้อมูลที่ staff เห็นตอนสแกน/ค้นหา
function pub_(r) {
  return {
    reg_id: r.reg_id,
    full_name: r.full_name,
    phone: r.phone,
    mmid: r.mmid,
    company: r.company,
    sales_name: r.sales_name,
    source: r.source,
    tier: r.tier || 'Walk-in',
    status: r.status,
    checked_in_at: fmt_(r.checked_in_at, 'HH:mm'),
    checked_in_by: r.checked_in_by
  };
}

// ข้อมูลเต็มสำหรับ admin
function full_(r) {
  const o = pub_(r);
  o.created_at = fmt_(r.created_at, 'yyyy-MM-dd HH:mm');
  o.checked_in_at_full = fmt_(r.checked_in_at, 'yyyy-MM-dd HH:mm');
  o.match_method = r.match_method;
  o.note = r.note;
  return o;
}

function fail_(msg) {
  const e = new Error(msg);
  e.userMessage = msg;
  throw e;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
