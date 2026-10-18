// ข้อความ 2 ภาษาสำหรับหน้าที่ลูกค้าเห็น (ภาษาอังกฤษเป็นค่าเริ่มต้น)
// ใช้: ใส่ data-i18n="key" (ข้อความ), data-i18n-html="key" (มีแท็ก), data-i18n-ph="key" (placeholder)

const I18N = {
  en: {
    'nav.myqr': 'My QR', 'nav.home': 'Home',
    'ev.date': 'Date', 'ev.time': 'Time', 'ev.venue': 'Venue', 'ev.tbc': 'To be announced',
    'cta.register': 'Register now', 'cta.myqr': 'Already registered? View my QR',
    'notice.age': 'This event is for guests aged 20 and over. Please present your ID card at the registration desk.',
    'reg.title': 'Registration', 'reg.sub': 'Complete the form below to receive your entry QR code.',
    'loading': 'Loading...',
    'f.name': 'Full name', 'f.name.err': 'Please enter your full name',
    'f.phone': 'Mobile number', 'f.phone.err': 'Please enter a 10-digit mobile number',
    'f.mmid': 'Makro membership number', 'f.optional': '(optional)', 'f.mmid.help': 'Shown on your Makro member card',
    'f.company': 'Shop / Company name',
    'f.age20': 'I confirm that I am 20 years of age or older and will present my ID card at the event.',
    'f.pdpa': 'I consent to the organiser using my information for this event.',
    'f.submit': 'Submit registration', 'f.sending': 'Submitting...', 'f.slow': 'High traffic. Please wait and keep this page open.',
    'f.missing': 'Please complete all fields marked *',
    'res.ok': 'Registration complete', 'res.sub': 'Please save this QR code and present it with your ID card at the event.',
    'res.exist': 'You are already registered', 'res.exist.sub': 'This mobile number or Makro membership number is already registered. Here is your QR code. Please present it with your ID card at the event.',
    'res.home': 'Back to home',
    'invite': '{tier} Invitation',
    'closed.full.title': 'Registration is full',
    'closed.full.body': 'All seats have now been taken. Thank you for your interest in Wine & Spirits Discovery 2026.\nIf you have already registered, you can view your entry QR using the button below.',
    'closed.closed.title': 'Registration is closed',
    'closed.closed.body': 'Registration for Wine & Spirits Discovery 2026 is now closed. Thank you for your interest.\nIf you have already registered, you can view your entry QR using the button below. For enquiries, please contact your Makro sales representative.',
    'card.code': 'Entry code (if the QR cannot be scanned)',
    'card.l1': 'Present this QR with your ID card at the registration desk',
    'card.l2': 'For guests aged 20 and over only',
    'card.save': 'Save QR image',
    'card.hint': 'If saving does not work, press and hold the image and choose "Save image", or take a screenshot.',
    'my.title': 'View my QR again', 'my.sub': 'Enter the mobile number you registered with',
    'my.find': 'Find my QR', 'my.finding': 'Searching...',
    'my.notreg': 'Not registered yet?', 'my.regHere': 'Register here',
    'my.qrTitle': 'Your entry QR', 'my.qrSub': 'Present this QR with your ID card at the event.',
    'my.notMe': 'Not your QR? Search by mobile number',
    'err.load': 'Unable to load event information. Please try again.',
    'age.title': 'Are you 20 years of age or older?',
    'age.sub': 'This website contains information about alcoholic beverages. Please confirm your age to continue.',
    'age.yes': 'Yes, I am 20+', 'age.no': 'No',
    'age.denied': 'Sorry, this event is for guests aged 20 and over only.',
    'hero.eyebrow': 'Makro presents · Wine & Spirits Discovery 2026',
    'hero.directions': 'Get directions', 'invite.you': "You're invited",
    'xp.kicker': 'The Experience',
    'xp.glow': 'One evening to taste, discover and connect with the finest wines and spirits.',
    'xp.1.t': 'Makro Bar & Bartenders', 'xp.1.d': 'Free-flow cocktails, crafted by professional bartenders.',
    'xp.2.t': 'Sommelier & Discovery Booths', 'xp.2.d': 'Taste curated wines and meet leading wine and spirits suppliers.',
    'xp.3.t': 'Lucky Draw & DJ', 'xp.3.d': 'Win great prizes, with live DJ sets all evening.',
    'nav.register': 'Register', 'nav.experience': 'Experience', 'nav.details': 'Details', 'det.kicker': 'Event Details',
    'venue.kicker': 'Venue', 'venue.lead': 'Registration opens at 5.00 PM. Please bring your ID card.',
    'venue.map': 'Open in Google Maps', 'venue.cal': 'Add to calendar',
    'reg.kicker': 'Register', 'reg.heading': 'Reserve your place',
    'reg.lead': 'Complete the form to receive your personal entry QR code. Places are limited.',
    'f.pdpa.more': 'Read more', 'f.pdpa.full': 'The organiser will collect and use your name, mobile number, Makro membership number and shop name for registration, event attendance and event-related communication.',
    'footer.presented': 'Presented by', 'sticky.register': 'Register now',
    'title.reg': 'Registration', 'title.myqr': 'My QR'
  },
  th: {
    'nav.myqr': 'ดู QR ของฉัน', 'nav.home': 'หน้าแรก',
    'ev.date': 'วันที่', 'ev.time': 'เวลา', 'ev.venue': 'สถานที่', 'ev.tbc': 'จะแจ้งให้ทราบ',
    'cta.register': 'ลงทะเบียนเข้าร่วมงาน', 'cta.myqr': 'ลงทะเบียนแล้ว ดู QR อีกครั้ง',
    'notice.age': 'งานนี้สำหรับผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น กรุณาแสดงบัตรประชาชนที่หน้างาน',
    'reg.title': 'ลงทะเบียน', 'reg.sub': 'กรอกข้อมูลให้ครบ เมื่อส่งแล้วจะได้รับ QR สำหรับเข้างาน',
    'loading': 'กำลังโหลด...',
    'f.name': 'ชื่อ-นามสกุล', 'f.name.err': 'กรุณากรอกชื่อ-นามสกุล',
    'f.phone': 'เบอร์โทรศัพท์มือถือ', 'f.phone.err': 'กรุณากรอกเบอร์โทร 10 หลัก',
    'f.mmid': 'หมายเลขสมาชิก Makro', 'f.optional': '(ถ้ามี)', 'f.mmid.help': 'ดูได้จากบัตรสมาชิกแม็คโคร',
    'f.company': 'ชื่อร้าน / บริษัท',
    'f.age20': 'ข้าพเจ้ายืนยันว่ามีอายุ 20 ปีบริบูรณ์ขึ้นไป และจะแสดงบัตรประชาชนที่หน้างาน',
    'f.pdpa': 'ข้าพเจ้ายินยอมให้ผู้จัดงานใช้ข้อมูลของข้าพเจ้าสำหรับงานนี้',
    'f.submit': 'ส่งข้อมูลลงทะเบียน', 'f.sending': 'กำลังส่งข้อมูล...', 'f.slow': 'มีผู้ลงทะเบียนจำนวนมาก กรุณารอสักครู่ และอย่าปิดหน้านี้',
    'f.missing': 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน',
    'res.ok': 'ลงทะเบียนสำเร็จ', 'res.sub': 'กรุณาบันทึกรูป QR นี้ไว้ และแสดงพร้อมบัตรประชาชนที่หน้างาน',
    'res.exist': 'คุณลงทะเบียนไว้แล้ว', 'res.exist.sub': 'เบอร์โทรหรือหมายเลขสมาชิก Makro นี้ลงทะเบียนไว้แล้ว นี่คือ QR เดิมของคุณ กรุณาแสดงพร้อมบัตรประชาชนที่หน้างาน',
    'res.home': 'กลับหน้าแรก',
    'invite': 'คำเชิญ {tier}',
    'closed.full.title': 'ขออภัย ที่นั่งเต็มแล้ว',
    'closed.full.body': 'ขณะนี้มีผู้ลงทะเบียนครบตามจำนวนที่กำหนดแล้ว ขอขอบพระคุณที่ให้ความสนใจในงาน Wine & Spirits Discovery 2026\nหากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง',
    'closed.closed.title': 'ปิดรับลงทะเบียนแล้ว',
    'closed.closed.body': 'ขอขอบพระคุณที่ให้ความสนใจ ขณะนี้งาน Wine & Spirits Discovery 2026 ปิดรับลงทะเบียนเรียบร้อยแล้ว\nหากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง สอบถามเพิ่มเติม กรุณาติดต่อ Sales ที่ดูแลท่าน',
    'card.code': 'รหัสเข้างาน (กรณีสแกนไม่ได้)',
    'card.l1': 'แสดง QR นี้พร้อมบัตรประชาชน ณ จุดลงทะเบียนหน้างาน',
    'card.l2': 'สำหรับผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น',
    'card.save': 'บันทึกรูป QR',
    'card.hint': 'หากกดบันทึกไม่ได้ ให้กดค้างที่รูปแล้วเลือก "บันทึกรูปภาพ" หรือแคปหน้าจอไว้',
    'my.title': 'ดู QR อีกครั้ง', 'my.sub': 'กรอกเบอร์โทรศัพท์ที่ใช้ลงทะเบียน',
    'my.find': 'ค้นหา QR', 'my.finding': 'กำลังค้นหา...',
    'my.notreg': 'ยังไม่ได้ลงทะเบียน?', 'my.regHere': 'ลงทะเบียนที่นี่',
    'my.qrTitle': 'QR สำหรับเข้างาน', 'my.qrSub': 'แสดง QR นี้พร้อมบัตรประชาชนที่หน้างาน',
    'my.notMe': 'ไม่ใช่ QR ของคุณ? ค้นหาด้วยเบอร์โทร',
    'err.load': 'ไม่สามารถโหลดข้อมูลงานได้ กรุณาลองใหม่อีกครั้ง',
    'age.title': 'คุณมีอายุ 20 ปีบริบูรณ์ขึ้นไปหรือไม่',
    'age.sub': 'เว็บไซต์นี้มีเนื้อหาเกี่ยวกับเครื่องดื่มแอลกอฮอล์ กรุณายืนยันอายุก่อนเข้าชม',
    'age.yes': 'ใช่ อายุ 20 ปีขึ้นไป', 'age.no': 'ไม่ใช่',
    'age.denied': 'ขออภัย งานนี้สำหรับผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น',
    'hero.eyebrow': 'แม็คโคร ขอเชิญร่วมงาน · Wine & Spirits Discovery 2026',
    'hero.directions': 'ดูเส้นทาง', 'invite.you': 'คุณได้รับเชิญ',
    'xp.kicker': 'ภายในงาน',
    'xp.glow': 'หนึ่งค่ำคืนสำหรับการลิ้มลอง ค้นพบ และพบปะ กับไวน์และสุราคัดสรร',
    'xp.1.t': 'Makro Bar และบาร์เทนเดอร์', 'xp.1.d': 'ค็อกเทลฟรีโฟลว์ โดยบาร์เทนเดอร์มืออาชีพ',
    'xp.2.t': 'ซอมเมลิเย่ร์ และบูธซัพพลายเออร์', 'xp.2.d': 'ชิมไวน์คัดสรร และพบซัพพลายเออร์ไวน์และสุราชั้นนำ',
    'xp.3.t': 'Lucky Draw และดีเจ', 'xp.3.d': 'ลุ้นรางวัล พร้อมดีเจตลอดค่ำคืน',
    'nav.register': 'ลงทะเบียน', 'nav.experience': 'ภายในงาน', 'nav.details': 'รายละเอียด', 'det.kicker': 'รายละเอียดงาน',
    'venue.kicker': 'สถานที่', 'venue.lead': 'เปิดลงทะเบียน 17:00 น. กรุณานำบัตรประชาชนมาด้วย',
    'venue.map': 'เปิด Google Maps', 'venue.cal': 'เพิ่มลงปฏิทิน',
    'reg.kicker': 'ลงทะเบียน', 'reg.heading': 'สำรองที่นั่งของคุณ',
    'reg.lead': 'กรอกข้อมูลเพื่อรับ QR สำหรับเข้างาน ที่นั่งมีจำนวนจำกัด',
    'f.pdpa.more': 'อ่านเพิ่ม', 'f.pdpa.full': 'ผู้จัดงานจะเก็บและใช้ข้อมูล ชื่อ เบอร์โทรศัพท์ หมายเลขสมาชิก Makro และชื่อร้าน เพื่อการลงทะเบียน การเข้าร่วมงาน และการติดต่อที่เกี่ยวข้องกับงานนี้',
    'footer.presented': 'จัดโดย', 'sticky.register': 'ลงทะเบียน',
    'title.reg': 'ลงทะเบียน', 'title.myqr': 'ดู QR ของฉัน'
  }
};

// ข้อความ error จากระบบ (ภาษาไทย) แปลเป็นอังกฤษ
const ERR_EN = {
  'เบอร์โทรต้องเป็นตัวเลข 10 หลัก': 'Mobile number must be 10 digits',
  'กรุณากรอกเบอร์โทร 10 หลัก': 'Please enter a 10-digit mobile number',
  'กรุณากรอกชื่อ-นามสกุล': 'Please enter your full name',
  'กรุณายืนยันว่ามีอายุ 20 ปีขึ้นไป': 'Please confirm that you are 20 years of age or older',
  'กรุณายินยอมให้เก็บข้อมูลส่วนบุคคล': 'Please give your consent for data collection',
  'ไม่พบการลงทะเบียนของเบอร์นี้': 'No registration found for this mobile number',
  'ไม่พบการลงทะเบียนนี้': 'Registration not found',
  'ปิดรับลงทะเบียนแล้ว': 'Registration is closed',
  'ที่นั่งเต็มแล้ว': 'Registration is full',
  'ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง': 'The system is busy. Please try again.',
  'เชื่อมต่อระบบไม่ได้ หรือระบบตอบช้าเกินไป กรุณาลองใหม่อีกครั้ง': 'Unable to connect, or the system is responding slowly. Please try again.',
  'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่': 'Something went wrong. Please try again.'
};

let LANG = (function () {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'th' || q === 'en') return q;
    const s = localStorage.getItem('pe_lang');
    if (s === 'th' || s === 'en') return s;
  } catch (e) {}
  return 'en';
})();

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.th[key] || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}

function tErr(msg) {
  return LANG === 'en' && ERR_EN[msg] ? ERR_EN[msg] : msg;
}

function applyI18n(root) {
  document.documentElement.lang = LANG;
  (root || document).querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
  (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)); });
}

// ปุ่ม EN | TH บนแถบด้านบน เรียก onChange หลังเปลี่ยนภาษา
function initLangToggle(onChange) {
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (LANG === b.dataset.lang) return;
      LANG = b.dataset.lang;
      try { localStorage.setItem('pe_lang', LANG); } catch (e) {}
      applyI18n();
      if (onChange) onChange();
    });
  });
  applyI18n();
}

// วันที่งานตามภาษา: Friday 6 November 2026 / 6 พฤศจิกายน 2569
function eventDateText(iso) {
  const d = parseEventDate(iso); // common.js
  if (!d) return iso || '';
  return LANG === 'en'
    ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : d.toLocaleDateString('th-TH', { dateStyle: 'long' });
}

// ข้อมูลงานตามภาษา (เวลา/สถานที่ภาษาอังกฤษตั้งได้ใน Settings: event_time_en / event_venue_en)
// ถ้ายังโหลดข้อมูลจากระบบไม่เสร็จ (หรือโหลดไม่ได้) ใช้ค่าเริ่มต้นของงานนี้ หน้าเว็บและการ์ด QR จะได้ไม่ว่าง
function eventInfoFor(cfg) {
  const en = LANG === 'en';
  return Object.assign({}, cfg, {
    lang: LANG,
    event_date: cfg.event_date || '2026-11-06',
    event_date_text: eventDateText(cfg.event_date || '2026-11-06'),
    event_time: en ? (cfg.event_time_en || '5.00 – 9.00 PM') : (cfg.event_time || '17:00 – 21:00 น.'),
    event_venue: en ? (cfg.event_venue_en || 'Vela Grand Ballroom, 2nd Floor, Cape Dara Resort Pattaya') : (cfg.event_venue || 'Vela Grand Ballroom ชั้น 2, Cape Dara Resort Pattaya')
  });
}
