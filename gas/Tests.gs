// รันจาก Apps Script editor เพื่อทดสอบ API ทุกตัว ข้อมูลทดสอบจะถูกลบเองตอนจบ
// เรียกผ่าน handle_() ตรงๆ จึงไม่ต้องรู้รหัสผ่าน (อ่านจาก Script Properties เอง)
function selfTest() {
  const props = PropertiesService.getScriptProperties();
  const results = [];
  const createdIds = [];
  const check = function (name, cond, detail) {
    results.push((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  -> ' + JSON.stringify(detail)));
  };
  const call = function (req) {
    try { return handle_(req); } catch (e) { return { ok: false, error: e.userMessage || String(e) }; }
  };
  const form = function (o) {
    return Object.assign({ full_name: 'ทดสอบ ระบบ', phone: '0000000001', mmid: 'TEST-0001', company: 'ร้านทดสอบ', age20: true, pdpa: true }, o);
  };
  let staffTok, adminTok;

  try {
    let r = call({ action: 'config' });
    check('config', r.ok && 'registration_open' in r, r);

    r = call(Object.assign({ action: 'register' }, form({ age20: false })));
    check('register ไม่ติ๊ก 20+ ต้องไม่ผ่าน', !r.ok, r);
    r = call(Object.assign({ action: 'register' }, form({ phone: '12345' })));
    check('register เบอร์ผิด ต้องไม่ผ่าน', !r.ok, r);

    r = call(Object.assign({ action: 'register' }, form({})));
    if (r.ok && !r.existing) createdIds.push(r.reg_id);
    check('register ใหม่', r.ok && /^PE[A-Z2-9]{10}$/.test(r.reg_id), r);
    const id1 = r.reg_id;

    r = call(Object.assign({ action: 'register' }, form({ phone: '000-000-0001', mmid: 'other' })));
    check('register เบอร์ซ้ำ คืน QR เดิม', r.ok && r.existing && r.reg_id === id1, r);
    r = call(Object.assign({ action: 'register' }, form({ phone: '0000000009', mmid: 'test.0001' })));
    check('register MMID ซ้ำ (ต่างแค่จุด/ขีด) คืน QR เดิม', r.ok && r.existing && r.reg_id === id1, r);

    r = call(Object.assign({ action: 'register', src: 'walkin' }, form({ phone: '0000000002', mmid: 'TEST-0002' })));
    if (r.ok && !r.existing) createdIds.push(r.reg_id);
    const id2 = r.reg_id;
    check('register walk-in', r.ok && readRegs_().byId[id2].source === 'Walk-in', r);

    r = call({ action: 'lookup', phone: '0000000001' });
    check('lookup ด้วยเบอร์', r.ok && r.reg_id === id1, r);
    r = call({ action: 'lookup', phone: '0000000099' });
    check('lookup เบอร์ไม่มี ต้องไม่เจอ', !r.ok, r);

    r = call({ action: 'login', role: 'staff', password: 'wrong-password' });
    check('login รหัสผิด ต้องไม่ผ่าน', !r.ok, r);
    r = call({ action: 'login', role: 'staff', password: props.getProperty('STAFF_PASS'), station: 'จุดทดสอบ' });
    staffTok = r.token;
    check('login staff', r.ok && !!staffTok, r);
    r = call({ action: 'login', role: 'admin', password: props.getProperty('ADMIN_PASS'), station: 'Admin' });
    adminTok = r.token;
    check('login admin', r.ok && !!adminTok, r);

    r = call({ action: 'scan', reg_id: id1 });
    check('scan ไม่มี token ต้องไม่ผ่าน', !r.ok && r.auth === false, r);
    r = call({ action: 'dashboard', token: staffTok });
    check('staff เข้า dashboard ไม่ได้', !r.ok && r.auth === false, r);

    r = call({ action: 'scan', token: staffTok, reg_id: id1.toLowerCase(), device: 'selfTest' });
    check('scan เจอ ยังไม่เช็คอิน (เขียว)', r.ok && r.result === 'found', r);
    r = call({ action: 'checkin', token: staffTok, reg_id: id1, device: 'selfTest' });
    check('checkin', r.ok && r.result === 'ok', r);
    r = call({ action: 'scan', token: staffTok, reg_id: id1, device: 'selfTest' });
    check('scan ซ้ำ (เหลือง) บอกเวลาและจุด', r.ok && r.result === 'duplicate' && r.person.checked_in_by === 'จุดทดสอบ' && /^\d\d:\d\d$/.test(r.person.checked_in_at), r);
    r = call({ action: 'checkin', token: staffTok, reg_id: id1, device: 'selfTest' });
    check('checkin ซ้ำ', r.ok && r.result === 'duplicate', r);
    r = call({ action: 'scan', token: staffTok, reg_id: 'PEXXXXXXXXXX', device: 'selfTest' });
    check('scan ไม่พบ (แดง)', r.ok && r.result === 'not_found', r);

    r = call({ action: 'search', token: staffTok, q: '0000000002' });
    check('search ด้วยเบอร์', r.ok && r.results.some(function (p) { return p.reg_id === id2; }), r);
    r = call({ action: 'search', token: staffTok, q: 'ทดสอบ ระบบ' });
    check('search ด้วยชื่อ', r.ok && r.results.length >= 2, r);

    r = call(Object.assign({ action: 'staff_register', token: staffTok, device: 'selfTest' }, form({ phone: '0000000003', mmid: 'TEST-0003' })));
    if (r.ok && r.person && !r.existing) createdIds.push(r.person.reg_id);
    check('staff ลงทะเบียนแทน + เช็คอินทันที', r.ok && r.result === 'ok' && readRegs_().byId[r.person.reg_id].source === 'Staff', r);

    r = call({ action: 'dashboard', token: adminTok });
    check('dashboard', r.ok && r.total >= 3 && r.attended >= 2 && Array.isArray(r.sales_summary), r);
    r = call({ action: 'list', token: adminTok });
    check('list', r.ok && r.records.some(function (p) { return p.reg_id === id2; }), r);
    r = call({ action: 'update', token: adminTok, reg_id: id2, fields: { note: 'แก้โดย selfTest', sales_name: 'Sales ทดสอบ' } });
    check('update + เลือก Sales เอง (manual)', r.ok && r.record.match_method === 'manual' && r.record.note === 'แก้โดย selfTest', r);
    r = call({ action: 'update', token: adminTok, reg_id: id2, fields: { phone: '0000000001' } });
    check('update เบอร์ซ้ำคนอื่น ต้องไม่ผ่าน', !r.ok, r);
    r = call({ action: 'update', token: adminTok, reg_id: id2, fields: { status: STATUS_IN } });
    check('admin เช็คอินเอง', r.ok && r.record.status === STATUS_IN, r);
    r = call({ action: 'sales_names', token: adminTok });
    check('sales_names', r.ok && Array.isArray(r.names), r);
    r = call({ action: 'rematch', token: adminTok });
    check('rematch (ถ้า Sales_List ยังว่าง จะแจ้งว่ายังตั้งค่าไม่ครบ = ปกติ)', r.ok || /Settings/.test(r.error), r);
    check('rematch ไม่ทับ manual', readRegs_().byId[id2].sales_name === 'Sales ทดสอบ', readRegs_().byId[id2]);

    r = call({ action: 'logout', token: staffTok });
    r = call({ action: 'scan', token: staffTok, reg_id: id1 });
    check('หลัง logout token ใช้ไม่ได้', !r.ok && r.auth === false, r);
  } finally {
    // ลบข้อมูลทดสอบ
    createdIds.forEach(function (id) { if (id) call({ action: 'delete', token: adminTok, reg_id: id }); });
    const left = readRegs_().records.filter(function (r) { return createdIds.indexOf(r.reg_id) !== -1; });
    results.push((left.length === 0 ? 'PASS ' : 'FAIL ') + 'delete ลบข้อมูลทดสอบหมด');
    const log = sheet_('Checkin_Log');
    const v = log.getDataRange().getValues();
    for (let i = v.length - 1; i >= 1; i--) {
      if (v[i][5] === 'selfTest' || v[i][5] === 'admin' && createdIds.indexOf(v[i][1]) !== -1) log.deleteRow(i + 1);
    }
    if (adminTok) call({ action: 'logout', token: adminTok });
    if (staffTok) call({ action: 'logout', token: staffTok });
  }

  const fails = results.filter(function (x) { return x.indexOf('FAIL') === 0; }).length;
  Logger.log(results.join('\n'));
  Logger.log(fails === 0 ? 'ผ่านทั้งหมด ' + results.length + ' ข้อ' : 'ไม่ผ่าน ' + fails + ' ข้อ');
}
