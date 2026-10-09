# HANDOFF: สถานะโปรเจกต์ pattaya-event

อัปเดตล่าสุด: 9 ต.ค. 2026 · ไฟล์นี้สรุปให้ Claude บนเครื่องใหม่ทำงานต่อได้ทันที

## สำหรับ Claude: อ่านก่อนเริ่ม

- **เจ้าของงานเขียนโค้ดไม่เป็น สื่อสารภาษาไทย** อธิบายภาษาคนก่อนเสมอ บอกขั้นตอนแบบ "กดตรงไหน" ทีละคลิก และชอบคำตอบสั้นเป็นข้อๆ
- **เสนอแผนแล้วรอให้ตอบตกลงก่อนเขียนโค้ด** ยกเว้นเจ้าของสั่งตรงๆ ว่า "ทำเลย" / "ปรับเลย"
- ถ้ามีเครื่องมือหรือเว็บที่ทำสิ่งนั้นได้อยู่แล้ว ให้บอกตั้งแต่ข้อความแรก
- บัญชีที่ใช้: Google `nuttaponaverutt@gmail.com` (clasp) · GitHub `nuttaponaverutt-commits` (gh)
- บน Windows ถ้าเพิ่งติดตั้ง node/clasp/gh ต้อง refresh PATH ก่อนเรียก:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
- การ login (clasp login, gh auth login) ให้เจ้าของเป็นคนกดเอง ห้ามใส่รหัสผ่านแทน

## ตั้งค่าเครื่องใหม่

1. ติดตั้ง: `winget install OpenJS.NodeJS.LTS`, `winget install GitHub.cli`, Git แล้ว `npm install -g @google/clasp`
2. `gh auth login` แล้ว `gh repo clone nuttaponaverutt-commits/pattaya-event`
3. `clasp login` (บัญชี nuttaponaverutt@gmail.com) · Apps Script API เปิดไว้แล้วที่ script.google.com/home/usersettings
4. คัดลอก `gas/Secrets.gs.example` เป็น `gas/Secrets.gs` แล้วใส่รหัสเริ่มต้น (ไฟล์นี้อยู่ใน .gitignore)
   - ไฟล์นี้ใช้แค่ตอน setup ครั้งแรก รหัสที่ใช้จริงอยู่ใน Script Properties แล้ว แต่ต้องมีไฟล์ไว้ ไม่งั้น `clasp push` จะลบไฟล์นี้ออกจาก Apps Script
5. `gas/.clasp.json` อยู่ใน repo แล้ว ผูกกับ Apps Script ตัวเดิมอัตโนมัติ

## งานนี้คืออะไร

**Wine & Spirits Discovery 2026** ("Discover A World of Flavours") presented by Makro
6 พ.ย. 2026 · 17:00–21:00 · Vela Grand Ballroom, Cape Dara Resort Pattaya · ผู้จัด Bang Bang Event & Organizer
งาน alcohol แบบปิด ความจุ 800 คน · เป้า VVIP 100 / VIP 500 / Walk-in 200
Agenda: 17:00 ลงทะเบียน · 19:20 Lucky Draw #1 · 20:10 Lucky Draw #2 · 21:00 จบงาน

## สถาปัตยกรรม

- `docs/` = หน้าเว็บ static บน GitHub Pages เรียก Apps Script เป็น API (fetch POST แบบ text/plain ตอบ JSON)
- `gas/` = Apps Script ที่ผูกกับ Google Sheet `Code.gs` (setup) / `Api.gs` (API ทั้งหมด) / `Tests.gs` (selfTest)
- รหัส STAFF_PASS / ADMIN_PASS อยู่ใน Script Properties ตรวจฝั่ง GAS เท่านั้น ล็อกอินแล้วได้ token อายุ 12 ชม. (เก็บใน Script Properties) เปลี่ยนรหัสแล้ว token เดิมใช้ไม่ได้ทันที
- ทุกการเขียนข้อมูลผ่าน LockService
- **Deploy ต้องใช้ ID เดิมทุกครั้ง** URL จะได้ไม่เปลี่ยน:
  `clasp push --force` แล้ว `clasp deploy -i AKfycbyW_wPvTkL8cgAu0Wj5XU-ZWajby3AXXOt9enrQIdTOp8sRVr3Uy81B3awiYhbApI8D --description "..."`
- **ทุกครั้งที่เพิ่มคอลัมน์หรือ Settings ใหม่ ต้องให้เจ้าของรัน `setup()` ใน Apps Script editor** setup รันซ้ำได้ เพิ่มคอลัมน์หรือแท็บที่ขาดโดยไม่ทับข้อมูลเดิม
- ก่อน push ให้ตรวจ syntax: รวม Secrets.gs, Code.gs, Api.gs, Tests.gs เป็นไฟล์เดียวแล้ว `node --check`

## ลิงก์

| | |
|---|---|
| ลงทะเบียน (ทั่วไป = Walk-in) | https://nuttaponaverutt-commits.github.io/pattaya-event/ |
| Walk-in หน้างาน | https://nuttaponaverutt-commits.github.io/pattaya-event/?src=walkin |
| ลิงก์เชิญ VVIP / VIP | `?inv=<รหัส>` ดูได้ที่หลังบ้าน เมนู "ลิงก์ลงทะเบียน" (รหัสอยู่ในแท็บ Settings) |
| ดู QR อีกครั้ง | https://nuttaponaverutt-commits.github.io/pattaya-event/myqr.html |
| Staff สแกน | https://nuttaponaverutt-commits.github.io/pattaya-event/staff/ |
| หลังบ้าน Admin | https://nuttaponaverutt-commits.github.io/pattaya-event/admin/ |
| Lucky Draw | https://nuttaponaverutt-commits.github.io/pattaya-event/admin/draw.html |
| Google Sheet | https://docs.google.com/spreadsheets/d/1Vngz3G6qVB5B2SKTWbx8LVAGT8xXe-eey5VHdg5F56I/edit |
| Apps Script editor | https://script.google.com/d/1EqdhL00desIavxISdUYzVj_Y95UaTRF_UJiDQzFzHy4oej0CINewsuy4/edit |
| หน้าสรุป journey (สำหรับหัวหน้า) | https://claude.ai/artifact/KeRVQD8xQr64g13Lgc4Dui |

## ทำเสร็จแล้ว

- **ลงทะเบียน:** บังคับกรอกแค่ชื่อกับเบอร์ MMID และร้านไม่บังคับ ต้องติ๊กยืนยันอายุ 20+ และ PDPA เบอร์หรือ MMID ซ้ำจะคืน QR เดิม ถ้าลงซ้ำด้วยลิงก์กลุ่มที่สูงกว่าจะเลื่อนกลุ่มให้แต่ไม่ลด ปิดรับเองเมื่อ registration_open=FALSE หรือครบ max_capacity
- **กลุ่ม VVIP / VIP / Walk-in:** แยกด้วยลิงก์ `?inv=<invite_code>` ไม่มีรหัสหรือรหัสผิดถือเป็น Walk-in
- **การ์ด QR:** ธีมดำทองตาม KV แสดงชื่อ กลุ่ม วันเวลา สถานที่ และ **รหัสสำรอง 5 ตัว** (short_code) ให้พิมพ์แทนเมื่อสแกนไม่ได้
- **Staff:** กล้องสแกน (html5-qrcode) ได้การ์ดเขียว/เหลือง/แดง ระบุ Wristband ตามกลุ่ม มีพิมพ์รหัสเอง ค้นหา ลงทะเบียนแทน (เลือกกลุ่มได้) บันทึก Checkin_Log ทุกครั้ง
  - แก้แล้ว: กล้องค้างตอนสลับเร็วๆ, กล้องไม่เปิดเมื่อล็อกอินค้างไว้, สแกน 1 ครั้งถูกส่ง 2 รอบ, เปิดจาก LINE ขึ้นปุ่ม openExternalBrowser, ข้อความ error แยกสาเหตุ, ปุ่มสลับกล้อง
  - ทดสอบด้วยกล้องจำลอง (Edge headless + ไฟล์ y4m ที่มี QR) ผ่านแล้ว 5 กรณี **ยังไม่ได้ทดสอบกับมือถือจริง**
- **Admin:** Dashboard (ยอดแต่ละกลุ่มเทียบเป้า, ช่องทาง, ความจุ, เช็คอินล่าสุด รีเฟรช 15 วิ), สรุปราย Sales, รายชื่อ (กรอง/แก้/ลบ/เช็คอิน/ดู QR/เลือก Sales เอง), Match ใหม่, Export CSV, หน้าลิงก์ลงทะเบียน (คัดลอก + QR โปสเตอร์)
- **Lucky Draw:** สุ่มฝั่ง server เฉพาะคนที่เช็คอินแล้ว ไม่สุ่มคนเดิมซ้ำ มีปุ่มสละสิทธิ์/สุ่มใหม่ บันทึกลงแท็บ Lucky_Draw
- **Match Sales:** จาก Sales_List ตาม MMID ก่อน แล้วเบอร์ 9 หลักท้าย อ่านชื่อคอลัมน์จาก Settings (sales_col_*)
- **รับมือกับ Google ที่ช้า:** หน้าเว็บรอสูงสุด 30 วิต่อครั้ง แล้วลองใหม่เองถึง 4 ครั้ง (เฉพาะคำสั่งที่ส่งซ้ำได้ปลอดภัย) ข้อมูลหน้าแรกเก็บไว้ชั่วคราวใน CacheService ทำให้ล็อกสั้นลง

## ค้างอยู่ ต้องให้เจ้าของทำ

1. **รัน `setup()` แล้ว `selfTest()`** ใน Apps Script editor (ยังไม่ได้รันรอบที่เพิ่ม tier / short_code / Lucky_Draw / invite_code)
2. ลบรายการทดสอบ "nutt" (0900000000) จากหลังบ้าน
3. ทดสอบสแกนด้วยมือถือ Staff จริง
4. เปลี่ยนรหัส Staff/Admin ก่อนแจกทีม (ตอนนี้ยังเป็นรหัสทดสอบ)

## รอคำตอบจากเจ้าของ

- **ลิงก์เชิญแยกราย Sales เอาไหม** (Sales 1 คน = ลิงก์ VVIP + VIP ลูกค้าที่ลงผ่านลิงก์จะผูกกับ Sales คนนั้นอัตโนมัติ)
- **โหมดออฟไลน์สำหรับ Staff เอาไหม** (โหลดรายชื่อเก็บในมือถือ สแกนเช็คจากในเครื่องทันที แล้วส่งขึ้น Sheet แบบเข้าคิว มีตัวบอก "รอส่ง N รายการ") ผมแนะนำให้ทำ เพราะวัดได้ว่า Apps Script ช้าเป็นพักๆ 4–155 วินาที
- การ์ดเชิญอัตโนมัติ (แบบ A: การ์ดราย Sales มี QR ลิงก์ของ Sales / แบบ B: การ์ดรายลูกค้า) ยังไม่ได้เลือก รอ artwork การ์ดเชิญฉบับจริง (กำหนด 12 ต.ค.)

## งานถัดไปที่ตกลงกันแล้ว (ยังไม่เริ่ม)

1. **หน้าจัดการ Sales** ในหลังบ้าน: เพิ่ม/แก้/ลบ Sales + ยอดราย Sales (รวมหน้าสรุปราย Sales เดิม)
2. **หน้าจัดการรายชื่อลูกค้าเป้าหมาย** แทนการวางลง Sales_List เอง: วางตารางจาก Excel ในหน้าเว็บ, เพิ่ม/แก้/ลบ, ดูสถานะ (ยังไม่ลงทะเบียน / ลงทะเบียนแล้ว / มาแล้ว)
3. **ปุ่มเปิด/ปิดรับลงทะเบียน** บนหน้าภาพรวม + แก้จำนวนรับสูงสุด
   - **ปิด = ปิดทุกลิงก์ รวม VVIP** ส่วน Staff ยังลงทะเบียนแทนหน้างานได้ (Admin จัดการเอง)
4. **หน้า Landing ตอนเต็ม/ปิด** ซ่อนฟอร์มแล้วขึ้นป้ายตามข้อความที่เสนอไว้ (เจ้าของยังไม่ได้ยืนยันข้อความ) และให้แก้ข้อความได้จากหลังบ้าน:
   - เต็ม: "ขออภัย ที่นั่งเต็มแล้ว / ขณะนี้มีผู้ลงทะเบียนครบตามจำนวนที่กำหนดแล้ว ขอขอบพระคุณที่ให้ความสนใจในงาน Wine & Spirits Discovery 2026 / หากท่านลงทะเบียนไว้แล้ว สามารถเรียกดู QR สำหรับเข้างานได้ที่ปุ่มด้านล่าง / Registration is now full. Thank you for your interest." + ปุ่ม ดู QR ของฉัน
   - ปิด: "ปิดรับลงทะเบียนแล้ว / ขอขอบพระคุณที่ให้ความสนใจ ขณะนี้งาน Wine & Spirits Discovery 2026 ปิดรับลงทะเบียนเรียบร้อยแล้ว / หากท่านลงทะเบียนไว้แล้ว ... / สอบถามเพิ่มเติม กรุณาติดต่อ Sales ที่ดูแลท่าน / Registration is now closed." + ปุ่ม ดู QR ของฉัน

## ยังขาดจากทีม

- KV ฉบับคอนเฟิร์ม (ตอนนี้ใช้ภาพ invitation จาก proposal PDF ไปก่อน ที่ `docs/assets/kv.jpg`)
- ข้อความ PDPA ฉบับจริงจากฝ่ายกฎหมาย
- รายชื่อลูกค้า VVIP/VIP จาก Sales: MMID, ชื่อร้าน, ชื่อผู้ติดต่อ, เบอร์โทร, ชื่อ Sales, กลุ่ม, สาขา
- รายชื่อ Sales ทั้งหมด (ถ้าเอาลิงก์แยกราย Sales)
- จำนวนจุดสแกนและจำนวน Staff

## ความเสี่ยงที่รู้แล้ว

- **Apps Script ตอบช้าเป็นพักๆ** (วัดได้ 4–155 วิ แม้แต่คำขอที่ไม่แตะ Sheet) เป็นข้อจำกัดฝั่ง Google · ทางแก้ที่เสนอ: โหมดออฟไลน์ หรือย้ายฝั่งเช็คอินไป Firebase
- อินเทอร์เน็ตที่ Cape Dara · ให้ Staff ใช้ 4G ของตัวเอง
- เบราว์เซอร์ในแอป LINE เปิดกล้องไม่ได้ และบันทึกรูปไม่ได้ · ให้ Staff เปิดใน Chrome/Safari
- ข้อมูลลูกค้าอยู่ใน Gmail ส่วนตัว · ถ้ามีคำถามเรื่อง PDPA ควรย้ายไปบัญชีบริษัท
- ดู QR อีกครั้งใช้แค่เบอร์โทร คนที่รู้เบอร์คนอื่นก็ดูได้ (เจ้าของรับทราบแล้ว หน้างานตรวจบัตรอีกชั้น)
