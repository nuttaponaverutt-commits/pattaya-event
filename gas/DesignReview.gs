// สร้าง Google Form สำหรับเก็บความเห็น Design Review จาก PIC (ไม่เกี่ยวกับระบบลงทะเบียน)
// รันฟังก์ชัน createDesignReviewForm จาก Apps Script editor ครั้งเดียว
// คำตอบไปอยู่ใน Google Sheet ใหม่แยกต่างหาก ไม่ปนกับข้อมูลลงทะเบียนลูกค้า

const REVIEW_IMG_BASE = 'https://nuttaponaverutt-commits.github.io/pattaya-event/review/';
const REVIEW_TITLE = 'Design Review – Wine & Spirits Discovery 2026';

const REVIEW_GROUPS = [
  { title: 'ฝั่งลูกค้า', desc: 'ลูกค้าเปิดจากลิงก์เชิญใน LINE บนมือถือเป็นหลัก', screens: [
    { title: 'หน้าแรก (Landing)', imgs: ['01-landing.jpg'],
      desc: 'KV ของงานแสดงเต็มภาพพร้อมโลโก้ Makro ใต้ภาพเป็นการ์ดชื่องาน วันเวลา สถานที่ และป้ายกลุ่มที่ได้รับเชิญ (เช่น "คำเชิญ VIP")',
      ask: ['ตำแหน่งและขนาด KV โอเคไหม', 'ชื่องานใต้ KV ใช้ "Wine & Spirits Discovery 2026" หรือ "Discover A World of Flavours"', 'ป้าย "คำเชิญ VIP" ควรเด่นกว่านี้ไหม'] },
    { title: 'ฟอร์มลงทะเบียน', imgs: ['02-form.jpg'],
      desc: 'บังคับกรอกชื่อและเบอร์โทร MMID และชื่อร้านใส่ถ้ามี ต้องติ๊กยืนยันอายุ 20+ และยินยอม PDPA',
      ask: ['ข้อมูลที่ขอครบหรือยัง ต้องการช่องอื่นเพิ่มไหม', 'ข้อความ PDPA ยังเป็นฉบับร่าง', 'คำอธิบายใต้ช่อง MMID ถูกต้องไหม'] },
    { title: 'การ์ด QR หลังลงทะเบียน', imgs: ['03-qr.jpg'],
      desc: 'ลูกค้าบันทึกเป็นรูปเก็บไว้ บนการ์ดมีชื่อ กลุ่ม วันเวลา สถานที่ QR และรหัสสำรอง 5 ตัวสำหรับพิมพ์แทนเมื่อสแกนไม่ได้',
      ask: ['อยากให้การ์ดใช้ดีไซน์เดียวกับ invitation card ไหม', 'ต้องการโลโก้ Makro หรือโลโก้ซัพพลายเออร์บนการ์ดไหม', 'ข้อความท้ายการ์ดเหมาะสมไหม'] },
    { title: 'หน้าตอนเต็มหรือปิดรับ (ยังไม่ได้ทำ)', imgs: [],
      desc: 'เมื่อครบ 800 คน หรือ Admin กดปิด ระบบจะซ่อนฟอร์มแล้วแสดงข้อความแทน\n\n' +
        'กรณีเต็ม: "ขออภัย ที่นั่งเต็มแล้ว / ขณะนี้มีผู้ลงทะเบียนครบตามจำนวนที่กำหนดแล้ว ขอขอบพระคุณที่ให้ความสนใจในงาน Wine & Spirits Discovery 2026 / หากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง / Registration is now full. Thank you for your interest." + ปุ่ม ดู QR ของฉัน\n\n' +
        'กรณีปิดรับ: "ปิดรับลงทะเบียนแล้ว / ขอขอบพระคุณที่ให้ความสนใจ ขณะนี้งาน Wine & Spirits Discovery 2026 ปิดรับลงทะเบียนเรียบร้อยแล้ว / หากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง สอบถามเพิ่มเติม กรุณาติดต่อ Sales ที่ดูแลท่าน / Registration is now closed." + ปุ่ม ดู QR ของฉัน',
      ask: ['ข้อความทั้งสองแบบใช้ได้ไหม', 'ต้องการบรรทัดภาษาอังกฤษไหม', 'ต้องการใส่ช่องทางติดต่อ (LINE OA / เบอร์) ไหม'] },
    { title: 'ดู QR อีกครั้ง', imgs: ['04-myqr.jpg'],
      desc: 'ลูกค้าที่ทำรูปหายกรอกเบอร์โทรเพื่อเรียกการ์ด QR เดิม',
      ask: ['ใช้แค่เบอร์โทรพอไหม หรือต้องกรอก MMID ด้วยเพื่อความปลอดภัย'] }
  ] },
  { title: 'ฝั่ง Staff หน้างาน', desc: 'มือถือ Staff ที่จุดลงทะเบียน 17:00 เป็นต้นไป', screens: [
    { title: 'Staff ล็อกอิน', imgs: ['05-staff-login.jpg'],
      desc: 'ตั้งชื่อจุดสแกน (จุด 1, จุด 2) และใส่รหัส Staff ใช้ได้ 12 ชั่วโมง',
      ask: ['หน้างานมีกี่จุดสแกน', 'ตั้งชื่อจุดแบบไหน (ตัวเลข / ชื่อประตู)'] },
    { title: 'สแกนและผลสแกน', imgs: ['06-staff-scan.jpg', '07-green.jpg', '09-yellow.jpg', '10-red.jpg'],
      desc: 'กล้องเต็มจอ (ภาพเป็นจอดำเพราะแคปจากเครื่องที่ไม่มีกล้อง) ผลสแกนเป็นสี เขียว = พบ ยังไม่เช็คอิน / เหลือง = เช็คอินแล้ว / แดง = ไม่พบ แถบบนการ์ดบอกว่าต้องให้ wristband กลุ่มไหน',
      ask: ['สี wristband จริงของแต่ละกลุ่มคือสีอะไร', 'ข้อมูลบนการ์ดผลสแกนครบไหม', 'ขนาดตัวอักษรอ่านง่ายพอไหมในที่แสงน้อย'] },
    { title: 'เช็คอินเรียบร้อย', imgs: ['08-ok.jpg'],
      desc: 'หลังกดยืนยัน กด "สแกนคนต่อไป" เพื่อกลับไปสแกน',
      ask: ['ต้องการให้แสดงข้อความต้อนรับ หรือข้อมูลอื่นไหม'] },
    { title: 'ค้นหาและลงทะเบียนแทน', imgs: ['11-search.jpg', '12-staff-register.jpg'],
      desc: 'คนไม่มี QR ค้นด้วยเบอร์ ชื่อ MMID หรือรหัส 5 ตัว คนที่ยังไม่ได้ลงทะเบียน Staff กรอกแทนแล้วเช็คอินทันที',
      ask: ['Staff ควรลงทะเบียนแทนได้ทุกกลุ่ม หรือได้แค่ Walk-in'] }
  ] },
  { title: 'ฝั่งหลังบ้าน', desc: 'ทีม Makro ใช้บนคอม และดูบนมือถือได้ (ตัวเลขในภาพเป็นตัวอย่าง)', screens: [
    { title: 'ภาพรวม (Dashboard)', imgs: ['13-admin-dashboard.jpg'],
      desc: 'ยอดรวม ยอดแต่ละกลุ่มเทียบเป้า ช่องทาง ความจุ และเช็คอินล่าสุด อัปเดตทุก 15 วินาที',
      ask: ['ตัวเลขที่หัวหน้าอยากเห็นมีอะไรอีก', 'อยากได้กราฟคนเข้างานรายช่วงเวลาไหม'] },
    { title: 'สรุปราย Sales', imgs: ['14-admin-sales.jpg'],
      desc: 'Sales แต่ละคน: ลูกค้าใน list / ลงทะเบียน / มาจริง / % มา',
      ask: ['ต้องการแยกตามสาขาด้วยไหม', 'Sales แต่ละคนควรเห็นยอดของตัวเองไหม'] },
    { title: 'รายชื่อและแก้ไขข้อมูล', imgs: ['15-admin-list.jpg', '16-admin-edit.jpg'],
      desc: 'ค้นหา กรองตามสถานะ กลุ่ม ช่องทาง Sales แก้ไข ลบ เช็คอินแทน ดู QR และ Export CSV',
      ask: ['คอลัมน์ในตารางครบไหม', 'ต้องการ Export แบบไหน (CSV / Excel / แยกกลุ่ม)'] },
    { title: 'ลิงก์ลงทะเบียน', imgs: ['18-admin-links.jpg'],
      desc: 'ลิงก์เชิญ VVIP / VIP / ทั่วไป / Walk-in หน้างาน พร้อมปุ่มคัดลอกและสร้าง QR โปสเตอร์',
      ask: ['จะให้ทำลิงก์แยกราย Sales ไหม', 'ต้องการให้ระบบสร้างรูป invitation card ราย Sales ให้เลยไหม'] },
    { title: 'Lucky Draw ขึ้นจอ', imgs: ['19-draw.jpg'],
      desc: 'สุ่มจากคนที่เช็คอินแล้ว เลือกกลุ่มได้ ไม่สุ่มคนเดิมซ้ำ มีปุ่มสละสิทธิ์/สุ่มใหม่ ใช้ตอน 19:20 และ 20:10',
      ask: ['จอจริงที่งานเป็นแนวนอน 16:9 ไหม', 'ต้องการแสดงชื่อรางวัลบนจอไหม', 'แยกรอบตามกลุ่ม หรือสุ่มรวมทุกกลุ่ม'] }
  ] }
];

function createDesignReviewForm() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty('DESIGN_REVIEW_FORM_ID');
  if (existing) {
    const f = FormApp.openById(existing);
    Logger.log('มีฟอร์มอยู่แล้ว ไม่ได้สร้างซ้ำ (ถ้าต้องการสร้างใหม่ ให้รัน resetDesignReviewForm ก่อน)');
    logReviewLinks_(f);
    return;
  }

  const form = FormApp.create(REVIEW_TITLE);
  form.setDescription(
    'ขอความเห็นการออกแบบระบบลงทะเบียนงาน Wine & Spirits Discovery 2026 (6 พ.ย. 2569 · Vela Grand Ballroom, Cape Dara Resort Pattaya)\n' +
    'ภาพทุกภาพแคปจากระบบจริง ใช้ข้อมูลตัวอย่าง ชื่อ เบอร์ และตัวเลขไม่ใช่ข้อมูลลูกค้าจริง\n' +
    'แต่ละหน้าจอเลือก "ผ่าน" หรือ "ขอแก้" แล้วพิมพ์ความเห็นได้ ไม่ต้องตอบทุกข้อ');
  form.setProgressBar(true);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage('ขอบคุณสำหรับความเห็น ทีมจะนำไปปรับระบบต่อ ถ้าต้องการแก้คำตอบ กดลิงก์ "แก้ไขคำตอบ" ด้านล่าง');

  form.addTextItem().setTitle('ชื่อ-ตำแหน่ง / ทีม ของผู้ให้ความเห็น').setRequired(true);

  let n = 0;
  REVIEW_GROUPS.forEach(function (g) {
    form.addPageBreakItem().setTitle(g.title).setHelpText(g.desc);
    g.screens.forEach(function (s) {
      n++;
      form.addSectionHeaderItem().setTitle(n + '. ' + s.title).setHelpText(s.desc);
      s.imgs.forEach(function (file) {
        const blob = UrlFetchApp.fetch(REVIEW_IMG_BASE + file).getBlob();
        form.addImageItem().setImage(blob);
      });
      form.addMultipleChoiceItem()
        .setTitle(n + '. ' + s.title + ': ผลการพิจารณา')
        .setChoiceValues(['ผ่าน', 'ขอแก้']);
      form.addParagraphTextItem()
        .setTitle(n + '. ' + s.title + ': ความเห็น')
        .setHelpText('อยากได้ความเห็นเรื่อง: ' + s.ask.join(' / '));
    });
  });

  form.addPageBreakItem().setTitle('ความเห็นภาพรวม');
  form.addParagraphTextItem().setTitle('ความเห็นภาพรวม').setHelpText('สี ฟอนต์ โทนโดยรวม หรือสิ่งที่อยากเพิ่มนอกเหนือจากหน้าจอด้านบน');

  const sheet = SpreadsheetApp.create(REVIEW_TITLE + ' (คำตอบ)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  props.setProperty('DESIGN_REVIEW_FORM_ID', form.getId());

  Logger.log('สร้างฟอร์มเสร็จแล้ว');
  logReviewLinks_(form);
}

// ลืมฟอร์มเดิม (ไม่ลบฟอร์มหรือคำตอบใน Drive) เพื่อให้รัน createDesignReviewForm สร้างใหม่ได้
function resetDesignReviewForm() {
  PropertiesService.getScriptProperties().deleteProperty('DESIGN_REVIEW_FORM_ID');
  Logger.log('รีเซ็ตแล้ว ฟอร์มเดิมยังอยู่ใน Drive ถ้าไม่ใช้แล้วลบเองได้');
}

function logReviewLinks_(form) {
  Logger.log('ลิงก์ส่งให้ PIC กรอก: ' + form.getPublishedUrl());
  Logger.log('ลิงก์แก้ไขฟอร์ม: ' + form.getEditUrl());
  const dest = form.getDestinationId();
  if (dest) Logger.log('Sheet คำตอบ: https://docs.google.com/spreadsheets/d/' + dest + '/edit');
}
