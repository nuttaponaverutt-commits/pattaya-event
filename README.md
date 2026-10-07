# pattaya-event

ระบบลงทะเบียนงาน Pattaya Event

- `docs/` คือหน้าเว็บที่ขึ้น GitHub Pages
- `gas/` คือ Google Apps Script ที่ผูกกับ Google Sheet "Pattaya Event Registration"

## หน้าเว็บ

| หน้า | ไฟล์ | ใช้ทำอะไร |
|---|---|---|
| Landing + ลงทะเบียน | `docs/index.html` | ลูกค้าลงทะเบียน ได้ QR (`?src=walkin` สำหรับ walk-in) |
| ดู QR อีกครั้ง | `docs/myqr.html` | ค้นด้วยเบอร์โทร |
| Staff | `docs/staff/` | สแกน QR เช็คอิน ค้นหา และลงทะเบียนแทน |
| Admin | `docs/admin/` | Dashboard, สรุป Sales, รายชื่อ, Match ใหม่, Export CSV |

รูป KV: วางไฟล์ `docs/assets/kv.jpg` แล้วรูปจะแทน placeholder เอง

## อัปเดตโค้ด Apps Script

```bash
cd gas
clasp push
clasp deploy -i AKfycbyW_wPvTkL8cgAu0Wj5XU-ZWajby3AXXOt9enrQIdTOp8sRVr3Uy81B3awiYhbApI8D --description "อธิบายสั้นๆ"
```

ต้องใส่ `-i <deployment id>` ทุกครั้ง URL ของ web app จะได้ไม่เปลี่ยน

## รหัส Staff / Admin

รหัสเก็บไว้ใน Script Properties (Apps Script editor → ⚙️ Project Settings → Script Properties) ไม่ได้อยู่ในโค้ด
ไฟล์ `gas/Secrets.gs` ใช้เป็นค่าเริ่มต้นตอนรัน setup ครั้งแรกเท่านั้น และไม่ขึ้น git (ดูตัวอย่างที่ `gas/Secrets.gs.example`)
