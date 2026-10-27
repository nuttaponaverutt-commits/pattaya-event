// API สำหรับหน้าเว็บใน docs/ เรียกด้วย fetch POST (Content-Type: text/plain) body = JSON {action, ...}
// ตอบกลับ JSON เสมอ: {ok:true, ...} หรือ {ok:false, error:'ข้อความภาษาไทย'}

const STATUS_PENDING = 'ยังไม่มา';
const STATUS_IN = 'มาแล้ว';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const TZ = 'Asia/Bangkok';
// กลุ่มลูกค้า เรียงจากสูงไปต่ำ (ใช้ตัดสินตอนลงทะเบียนซ้ำด้วยลิงก์กลุ่มที่สูงกว่า)
const TIERS = ['VVIP', 'VIP', 'Walk-in'];
// สาขา Makro ให้ลูกค้าเลือกตอนลงทะเบียน (ต้องตรงกับ BRANCHES ใน docs/assets/common.js) เลือก Other แล้วพิมพ์เองได้
const BRANCHES = [
  'Makro Ladpraw (ST01)', 'Makro Srinakarin (ST03)', 'Makro Sathon (ST18)', 'Makro Bang Phli (ST57)',
  'Makro Rayong (ST15)', 'Makro Chanthaburi (ST26)', 'Makro Chonburi (ST05)', 'Makro South Pattaya (ST44)',
  'Makro North Pattaya (ST66)', 'Makro Lamchabang (ST109)', 'Makro Bowin (ST131)', 'Makro Sattahip (ST132)',
  'Makro Amata Nakorn (ST134)', 'Makro Amata Nakorn 2 (ST162)', 'Makro Ban Bueng (ST168)', 'Head Office', 'Other'
];

const PUBLIC_ACTIONS = {
  config: apiConfig_,
  register: apiRegister_,
  lookup: apiLookup_,
  card: apiCard_,
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
  draw_void: apiDrawVoid_,
  // อยู่ใน Customers.gs เรียกผ่านฟังก์ชันห่อ เพื่อไม่ขึ้นกับลำดับการโหลดไฟล์
  customers: function (req, sess) { return apiCustomers_(req, sess); },
  customers_import: function (req, sess) { return apiCustomersImport_(req, sess); },
  customer_update: function (req, sess) { return apiCustomerUpdate_(req, sess); },
  customers_bulk: function (req, sess) { return apiCustomersBulk_(req, sess); },
  settings_get: function (req, sess) { return apiSettingsGet_(req, sess); },
  settings_update: function (req, sess) { return apiSettingsUpdate_(req, sess); }
};

function doPost(e) {
  let res;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    res = handle_(req);
  } catch (err) {
    if (!err.userMessage) console.error(err && err.stack || err);
    res = { ok: false, error: err.userMessage || 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' };
    if (err.busy) res.busy = true; // หน้าเว็บจะส่งใหม่เอง
    // Google ตอบช้าหรือรับงานไม่ไหว (Sheet หมดเวลา, เรียกถี่เกิน) ให้หน้าเว็บส่งใหม่เองเหมือนตอนระบบยุ่ง
    else if (!err.userMessage && /timed out|too many|invoked too many|try again|service error|service unavailable|exceeded|lock/i.test(String(err && err.message))) {
      res.error = 'ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง';
      res.busy = true;
    }
  }
  return json_(res);
}

function handle_(req) {
  const action = String(req && req.action || '');
  const has = function (map) { return Object.prototype.hasOwnProperty.call(map, action); };
  if (has(PUBLIC_ACTIONS)) return PUBLIC_ACTIONS[action](req);

  let sess = verifyToken_(req.token);
  if (!sess) return { ok: false, auth: false, error: 'กรุณาเข้าสู่ระบบใหม่' };
  // เครื่อง Staff เปลี่ยนชื่อตัวเองได้หลังล็อกอิน ใช้ชื่อล่าสุดที่ส่งมาแทนชื่อตอนล็อกอิน
  if (sess.role === 'staff' && req.station_name) sess = Object.assign({}, sess, { station: clip_(req.station_name, 40) });
  if (has(STAFF_ACTIONS)) return STAFF_ACTIONS[action](req, sess);
  if (has(ADMIN_ACTIONS)) {
    if (sess.role !== 'admin') return { ok: false, auth: false, error: 'ไม่มีสิทธิ์ใช้งานส่วนนี้' };
    return ADMIN_ACTIONS[action](req, sess);
  }
  return { ok: false, error: 'ไม่รู้จักคำสั่งนี้' };
}

// ---------- Public ----------

// ทุกคนที่เปิดหน้าลงทะเบียนเรียกตัวนี้ จึงเก็บผลไว้ 20 วินาที ลดภาระตอนลิงก์ถูกแชร์ในกลุ่ม LINE
function apiConfig_(req) {
  const s0 = getSettingsCached_();
  const tier = tierFromCode_(s0, req && req.inv);
  const hit = cacheGet_('cfg_' + tier);
  if (hit) return JSON.parse(hit);
  const s = s0;
  const state = onlineState_(s, countCached_());
  const out = {
    ok: true,
    event_name: String(s.event_name || ''),
    event_date: dateStr_(s.event_date),
    event_time: String(s.event_time || ''),
    event_venue: String(s.event_venue || ''),
    tier: tier,
    registration_open: state.open,
    closed_reason: state.reason,
    closed_kind: state.kind || '',
    closed_title: state.kind ? String(s['msg_' + state.kind + '_title'] || state.reason) : '',
    closed_body: state.kind ? String(s['msg_' + state.kind + '_body'] || '') : '',
    closed_title_en: state.kind ? String(s['msg_' + state.kind + '_title_en'] || '') : '',
    closed_body_en: state.kind ? String(s['msg_' + state.kind + '_body_en'] || '') : '',
    event_time_en: String(s.event_time_en || ''),
    event_venue_en: String(s.event_venue_en || '')
  };
  cachePut_('cfg_' + tier, JSON.stringify(out), 20);
  if (CACHE_ERR) out.cache_error = CACHE_ERR;
  return out;
}

function apiRegister_(req) {
  const f = validateForm_(req);
  const source = req.src === 'walkin' ? 'Walk-in' : 'Online';
  const pre = prepareRegistration_(f);
  const tier = tierFromCode_(pre.s, req.inv);
  const r = withLock_(function () { return createRegistration_(f, source, tier, pre); });
  return {
    ok: true, existing: r.existing, reg_id: r.rec.reg_id, short_code: r.rec.short_code,
    full_name: r.rec.full_name, tier: r.rec.tier
  };
}

function apiLookup_(req) {
  const key = phoneKey_(cleanPhone_(req.phone));
  if (!key) return { ok: false, error: 'กรุณากรอกเบอร์โทร 10 หลัก' };
  const t = readRegs_();
  const hit = t.records.find(function (r) { return phoneKey_(r.phone) === key; });
  if (!hit) return { ok: false, error: 'ไม่พบการลงทะเบียนของเบอร์นี้' };
  return { ok: true, reg_id: hit.reg_id, short_code: hit.short_code, full_name: hit.full_name, tier: hit.tier };
}

// ข้อมูลการ์ด QR ล่าสุดจากรหัสใน QR (ใช้ให้การ์ดที่เก็บในมือถือเป็นข้อมูลปัจจุบัน เช่น รหัส 5 ตัว กลุ่ม)
function apiCard_(req) {
  const rec = readRegs_().byId[normId_(req.reg_id)];
  if (!rec) return { ok: false, error: 'ไม่พบการลงทะเบียนนี้' };
  return { ok: true, reg_id: rec.reg_id, short_code: rec.short_code, full_name: rec.full_name, tier: rec.tier || 'Walk-in' };
}

function apiLogin_(req) {
  const role = req.role === 'admin' ? 'admin' : 'staff';
  const props = PropertiesService.getScriptProperties();
  const pass = props.getProperty(role === 'admin' ? 'ADMIN_PASS' : 'STAFF_PASS');
  // ใส่รหัสผิดเกิน 15 ครั้งใน 10 นาที (นับรวมทุกเครื่อง) ล็อกการเข้าสู่ระบบของบทบาทนั้นไว้ก่อน กันการสุ่มเดารหัส
  const failKey = 'login_fail_' + role;
  const fails = Number(cacheGet_(failKey) || 0);
  if (fails >= 15) return { ok: false, error: 'ใส่รหัสผิดหลายครั้งเกินไป กรุณารอ 10 นาทีแล้วลองใหม่' };
  if (!pass || String(req.password || '') !== pass) {
    cachePut_(failKey, String(fails + 1), 600);
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
  let id = normId_(req.reg_id);
  const t = readRegs_();
  const rec = findRec_(t, id);
  if (rec) id = rec.reg_id;
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
    if (q.toUpperCase() === String(r.short_code)) return true;
    return qMmid && mmidKey_(r.mmid) === qMmid;
  }).slice(0, 20).map(pub_);
  return { ok: true, results: results };
}

// staff ลงทะเบียนแทนแล้วเช็คอินทันที (ไม่สนว่าปิดรับออนไลน์หรือเต็มแล้ว)
function apiStaffRegister_(req, sess) {
  const f = validateForm_(req);
  const tier = TIERS.indexOf(req.tier) !== -1 ? req.tier : 'Walk-in';
  const pre = prepareRegistration_(f);
  return withLock_(function () {
    const r = createRegistration_(f, 'Staff', tier, pre);
    const c = checkinById_(r.rec.reg_id, sess, req.device);
    c.existing = r.existing;
    return c;
  });
}

// ---------- Admin ----------

// หน้าภาพรวมรีเฟรชทุก 15 วินาทีต่อแท็บ เก็บผลไว้ 10 วินาที ไม่ให้แย่งเวลาระบบกับคนที่กำลังลงทะเบียน
function apiDashboard_() {
  const hit = cacheGet_('dash');
  if (hit) return JSON.parse(hit);
  const out = buildDashboard_();
  try { const s = JSON.stringify(out); if (s.length < 90000) cachePut_('dash', s, 10); } catch (e) {}
  return out;
}

function buildDashboard_() {
  const t = readRegs_();
  const recs = t.records;
  const s = getSettings_();

  const bySource = { 'Online': 0, 'Walk-in': 0, 'Staff': 0 };
  const targets = { 'VVIP': s.target_vvip, 'VIP': s.target_vip, 'Walk-in': s.target_walkin };
  const byTier = {};
  TIERS.forEach(function (t) { byTier[t] = { registered: 0, attended: 0, target: Number(targets[t]) || 0 }; });
  let attended = 0, weak = 0;

  recs.forEach(function (r) {
    if (bySource[r.source] !== undefined) bySource[r.source]++;
    const isIn = r.status === STATUS_IN;
    if (isIn) attended++;
    const t = byTier[r.tier] || byTier['Walk-in'];
    t.registered++;
    if (isIn) t.attended++;
    if (WEAK_MATCH.indexOf(r.match_method) !== -1) weak++;
  });
  const sum = salesAndStoreSummary_(recs);

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
    sales_summary: sum.sales.map(function (x) { return Object.assign({ sales_name: x.name }, x); }),
    store_summary: sum.stores,
    has_customers: sum.has_customers,
    weak_matches: weak,
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
    if ('branch' in fields) upd.branch = clip_(fields.branch, 100);
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

    if (upd.phone) {
      const dup = findDuplicate_(t, upd.phone, id);
      if (dup) fail_('เบอร์โทรซ้ำกับ ' + dup.full_name + ' (' + dup.reg_id + ')');
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

// จับคู่ใหม่ทุกรายการกับรายชื่อลูกค้าล่าสุด ยกเว้นรายการที่ Admin เลือก Sales เอง (manual)
function apiRematch_() {
  const idx = customerIndex_();
  if (!idx.ready && !salesIndex_(getSettings_()).ready) fail_('ยังไม่มีรายชื่อลูกค้า กรุณานำเข้ารายชื่อที่เมนู "รายชื่อลูกค้า" ก่อน');
  return withLock_(function () {
    const t = readRegs_();
    let matched = 0, checked = 0, weak = 0;
    t.records.forEach(function (r) {
      if (r.match_method === 'manual') return;
      checked++;
      const m = matchCustomer_(idx, r);
      const upd = {};
      ['sales_name', 'match_method', 'cust_no', 'customer_name', 'store'].forEach(function (k) {
        if (String(r[k] || '') !== String(m[k] || '')) upd[k] = m[k] || '';
      });
      if (m.cust_tier && higherTier_(r.tier, m.cust_tier) !== r.tier) upd.tier = m.cust_tier;
      if (Object.keys(upd).length) writeFields_(t, r, upd);
      if (m.sales_name) matched++;
      if (WEAK_MATCH.indexOf(m.match_method) !== -1) weak++;
    });
    return { ok: true, checked: checked, matched: matched, weak: weak };
  });
}

function apiSalesNames_() {
  const set = {};
  customerIndex_().rows.forEach(function (r) { if (r.sales_name) set[r.sales_name] = 1; });
  salesIndex_(getSettings_()).names.forEach(function (n) { set[n] = 1; });
  return { ok: true, names: Object.keys(set).sort() };
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

// งานที่ไม่ต้องล็อก (อ่าน Settings และรายชื่อ Sales) ทำก่อนเข้าคิว ให้แต่ละคนถือล็อกสั้นที่สุด
function prepareRegistration_(f) {
  // ใช้ค่าที่จำไว้ (Settings 30 วินาที, รายชื่อลูกค้า 5 นาที) แก้จากหลังบ้านแล้วล้างทันที
  const s = getSettingsCached_();
  return { s: s, match: matchCustomer_(customerIndexCached_(), f) };
}

// กลุ่มที่สูงกว่า (VVIP > VIP > Walk-in)
function higherTier_(a, b) {
  const ia = TIERS.indexOf(a), ib = TIERS.indexOf(b);
  if (ia === -1) return ib === -1 ? 'Walk-in' : b;
  if (ib === -1) return a;
  return ia <= ib ? a : b;
}

function createRegistration_(f, source, tier, pre) {
  pre = pre || prepareRegistration_(f);
  const t = readRegs_();
  const dup = findDuplicate_(t, f.phone, null);
  if (dup) {
    // ลงซ้ำด้วยลิงก์กลุ่มที่สูงกว่า ให้ยกระดับกลุ่ม ไม่ลดระดับ
    const cur = TIERS.indexOf(dup.tier) === -1 ? TIERS.length - 1 : TIERS.indexOf(dup.tier);
    const upd = {};
    if (TIERS.indexOf(tier) !== -1 && TIERS.indexOf(tier) < cur) upd.tier = tier;
    // คนที่ลงทะเบียนก่อนมีช่องสาขา ลงซ้ำแล้วเลือกสาขามา ให้เก็บไว้ด้วย
    if (f.branch && !dup.branch) upd.branch = f.branch;
    if (Object.keys(upd).length) {
      writeFields_(t, dup, upd);
      Object.assign(dup, upd);
    }
    return { existing: true, rec: dup };
  }

  if (source !== 'Staff') {
    const state = onlineState_(pre.s, t.records.length);
    if (!state.open) fail_(state.reason);
  }
  const m = pre.match;
  const rec = {
    reg_id: newRegId_(t),
    short_code: t.col.short_code !== undefined ? newShortCode_(t) : '',
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
    // ลูกค้าที่อยู่ในรายชื่อเชิญ ได้กลุ่มตามรายชื่อ ถ้าสูงกว่ากลุ่มของลิงก์
    tier: higherTier_(tier, m.cust_tier),
    cust_no: m.cust_no || '',
    customer_name: m.customer_name || '',
    store: m.store || '',
    branch: f.branch || ''
  };
  appendRecord_(t, rec);
  return { existing: false, rec: rec };
}

function checkinById_(id, sess, device) {
  const t = readRegs_();
  const rec = findRec_(t, id);
  if (rec) id = rec.reg_id;
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
    company: clip_(req.company, 100),
    // หน้าเว็บบังคับเลือก แต่ฝั่งนี้ไม่บังคับ คนที่เปิดหน้าเว็บเก่าค้างไว้จะได้ยังลงทะเบียนได้
    branch: cleanBranch_(req.branch, req.branch_other)
  };
  if (!f.full_name) fail_('กรุณากรอกชื่อ-นามสกุล');
  if (!/^0\d{9}$/.test(f.phone)) fail_('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  if (req.age20 !== true) fail_('กรุณายืนยันว่ามีอายุ 20 ปีขึ้นไป');
  if (req.pdpa !== true) fail_('กรุณายินยอมให้เก็บข้อมูลส่วนบุคคล');
  return f;
}

function onlineState_(s, count) {
  if (!isTrue_(s.registration_open)) return { open: false, kind: 'closed', reason: 'ปิดรับลงทะเบียนแล้ว' };
  const max = Number(s.max_capacity) || 0;
  if (max && count >= max) return { open: false, kind: 'full', reason: 'ที่นั่งเต็มแล้ว' };
  return { open: true, kind: '', reason: '' };
}

// ลงซ้ำดูจากเบอร์โทรเท่านั้น (หมายเลขสมาชิก Makro ใช้ร่วมกันได้ทั้งร้าน หลายคนในร้านเดียวกันลงทะเบียนแยกกันได้)
function findDuplicate_(t, phone, exceptId) {
  const pk = phoneKey_(phone);
  if (!pk) return null;
  return t.records.find(function (r) {
    return r.reg_id !== exceptId && phoneKey_(r.phone) === pk;
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
  const byCode = {};
  v.forEach(function (row, i) {
    if (!row[col.reg_id]) return;
    const rec = { _row: i + 2 };
    h.forEach(function (name, j) { rec[name] = row[j]; });
    rec.phone = String(rec.phone);
    rec.mmid = String(rec.mmid);
    rec.short_code = String(rec.short_code || '');
    records.push(rec);
    byId[rec.reg_id] = rec;
    if (rec.short_code) byCode[rec.short_code] = rec;
  });
  return { sh: sh, h: h, col: col, records: records, byId: byId, byCode: byCode };
}

// หาได้ทั้งจากรหัสใน QR และรหัสสำรอง 5 ตัว
function findRec_(t, id) {
  return t.byId[id] || t.byCode[id] || null;
}

function countRegistrations_() {
  return readRegs_().records.length;
}

// จำนวนผู้ลงทะเบียน (เก็บไว้ 60 วินาที อัปเดตทุกครั้งที่มีคนลงทะเบียนใหม่) ใช้แค่เช็คว่าเต็มหรือยังตอนเปิดหน้า
function countCached_() {
  const hit = cacheGet_('reg_count');
  if (hit !== null && hit !== undefined) return Number(hit);
  const n = countRegistrations_();
  cachePut_('reg_count', String(n), 60);
  return n;
}

function appendRecord_(t, rec) {
  const row = t.sh.getLastRow() + 1;
  const range = t.sh.getRange(row, 1, 1, t.h.length);
  // setup() ตั้งคอลัมน์เหล่านี้เป็น text ไว้ล่วงหน้าแล้ว ถ้าแถวเกินที่ตั้งไว้ค่อยตั้งทีละช่อง
  if (row > regTextRows_()) {
    t.sh.getRange(row, t.col.phone + 1).setNumberFormat('@');
    t.sh.getRange(row, t.col.mmid + 1).setNumberFormat('@');
    // รหัสอย่าง 2E345 จะถูกแปลงเป็นตัวเลขถ้าไม่ตั้งเป็น text
    if (t.col.short_code !== undefined) t.sh.getRange(row, t.col.short_code + 1).setNumberFormat('@');
    if (t.col.cust_no !== undefined) t.sh.getRange(row, t.col.cust_no + 1).setNumberFormat('@');
  }
  range.setValues([t.h.map(function (name) { return safe_(rec[name]); })]);
  rec._row = row;
  t.records.push(rec);
  t.byId[rec.reg_id] = rec;
  if (rec.short_code) t.byCode[rec.short_code] = rec;
  cachePut_('reg_count', String(t.records.length), 60);
}

// จำนวนแถวที่ setup() ตั้งเป็น text ไว้แล้ว (เก็บใน cache ลดการอ่าน Script Properties ระหว่างถือล็อก)
function regTextRows_() {
  const hit = cacheGet_('reg_text_rows');
  if (hit !== null && hit !== undefined) return Number(hit);
  const n = Number(PropertiesService.getScriptProperties().getProperty('REG_TEXT_ROWS') || 0);
  cachePut_('reg_text_rows', String(n), 3600);
  return n;
}

// แก้หลายช่องของแถวเดียวในการเขียนครั้งเดียว (ช่องที่อยู่ระหว่างกลางแต่ไม่ได้แก้ ใช้ค่าเดิมจาก rec ที่อ่านภายใต้ล็อกเดียวกัน)
function writeFields_(t, rec, upd) {
  const cols = Object.keys(upd).filter(function (k) { return t.col[k] !== undefined; }).map(function (k) { return t.col[k]; });
  if (!cols.length) return;
  const lo = Math.min.apply(null, cols), hi = Math.max.apply(null, cols);
  const row = [];
  for (let c = lo; c <= hi; c++) {
    const name = t.h[c];
    row.push(safe_(Object.prototype.hasOwnProperty.call(upd, name) ? upd[name] : rec[name]));
  }
  t.sh.getRange(rec._row, lo + 1, 1, row.length).setValues([row]);
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

// Settings แบบเก็บไว้ 30 วินาที ใช้กับงานที่ไม่ต้องการค่าล่าสุดทันที
function getSettingsCached_() {
  const hit = cacheGet_('settings');
  if (hit) return JSON.parse(hit);
  const s = getSettings_();
  // วันที่ใน Sheet เป็น Date ซึ่ง JSON จะแปลงเป็นเวลา UTC แบบ 2026-11-05T17:00:00.000Z จึงแปลงเป็น yyyy-MM-dd ก่อน
  Object.keys(s).forEach(function (k) { if (s[k] instanceof Date) s[k] = fmt_(s[k], 'yyyy-MM-dd'); });
  cachePut_('settings', JSON.stringify(s), 30);
  return s;
}

// วันที่จาก Settings เป็นข้อความ yyyy-MM-dd เสมอ (รับได้ทั้ง Date และข้อความ)
function dateStr_(v) {
  if (v instanceof Date) return fmt_(v, 'yyyy-MM-dd');
  const s = String(v || '');
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d)) return fmt_(d, 'yyyy-MM-dd');
  }
  return s;
}

// cache เป็นตัวเสริมความเร็ว ถ้าใช้ไม่ได้ให้ทำงานต่อโดยอ่านจาก Sheet ตรงๆ
let CACHE_ERR = '';
function cacheGet_(key) {
  try { return CacheService.getScriptCache().get(key); } catch (e) { CACHE_ERR = String(e).slice(0, 120); return null; }
}
function cachePut_(key, value, ttl) {
  try { CacheService.getScriptCache().put(key, value, ttl); } catch (e) { CACHE_ERR = String(e).slice(0, 120); }
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    const e = new Error('busy');
    e.userMessage = 'ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง';
    e.busy = true;
    throw e;
  }
  try {
    return fn();
  } finally {
    // เขียนลง Sheet ให้เสร็จจริงก่อนปล่อยล็อก ไม่งั้นคนถัดไปอาจอ่านข้อมูลเก่า แล้วเขียนทับแถวเดียวกัน
    try { SpreadsheetApp.flush(); } catch (e) {}
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

// รหัสสำรอง 5 ตัว ให้ Staff พิมพ์แทนเมื่อสแกนไม่ได้ (ตัด 0/O/1/I/L ที่สับสนง่าย, ประมาณ 28 ล้านแบบ)
function newShortCode_(t) {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c;
  do {
    const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
    c = '';
    for (let i = 0; i < 5; i++) c += A[(b[i] + 256) % A.length];
  } while (t.byCode[c] || t.byId[c]);
  return c;
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
    short_code: r.short_code || '',
    full_name: r.full_name,
    phone: r.phone,
    mmid: r.mmid,
    company: r.company,
    sales_name: r.sales_name,
    customer_name: r.customer_name || '',
    store: r.store || '',
    branch: r.branch || '',
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
  o.cust_no = r.cust_no ? String(r.cust_no) : '';
  o.note = r.note;
  return o;
}

// รับเฉพาะสาขาที่อยู่ในรายการ ถ้าเลือก Other เก็บเป็น "Other: ชื่อที่พิมพ์"
function cleanBranch_(b, other) {
  b = clip_(b, 60);
  if (b === 'Other') {
    const o = clip_(other, 60);
    return o ? 'Other: ' + o : 'Other';
  }
  return BRANCHES.indexOf(b) !== -1 ? b : '';
}

function fail_(msg) {
  const e = new Error(msg);
  e.userMessage = msg;
  throw e;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
