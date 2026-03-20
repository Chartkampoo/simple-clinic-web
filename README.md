# ClinicPro 🏥 - ระบบจัดการคลินิกสมัยใหม่

ClinicPro เป็นแอปพลิเคชันเว็บแบบครบวงจรสำหรับการจัดการคลินิก ที่ออกแบบมาเพื่อเพิ่มประสิทธิภาพในการทำงานของแพทย์ เจ้าหน้าที่ และอำนวยความสะดวกให้กับผู้ป่วย ด้วยระบบที่ทันสมัย ใช้งานง่าย และมีความปลอดภัยสูง

## ✨ ฟีเจอร์หลัก (Features)

- **ระบบจัดการผู้ใช้งาน 3 ระดับ (Role-based Access Control)**
  - 👨‍⚕️ **DOCTOR (แพทย์):** จัดการเวชระเบียนของผู้ป่วย, ดูตารางนัดหมาย, บันทึกผลการวินิจฉัยและการรักษา
  - 👩‍💼 **STAFF (เจ้าหน้าที่):** จัดการข้อมูลผู้ป่วย, อนุมัติ/จัดการคิวนัดหมาย, รายงานสถิติเบื้องต้น
  - 🧑‍🦱 **PATIENT (ผู้ป่วย):** ดูประวัติการรักษาของตนเอง, จองคิวนัดหมายแพทย์, ติดตามสถานะนัดหมาย
- **ระบบยืนยันตัวตน (Authentication):** ปลอดภัยด้วยการเข้ารหัสรหัสผ่าน (Bcrypt) และใช้ JWT Token
- **ระบบนัดหมาย (Appointment System):** จองคิว และติดตามสถานะ (PENDING, COMPLETED, CANCELLED)
- **ระบบเวชระเบียน (Medical Records):** บันทึกประวัติการรักษาอย่างเป็นระบบและสืบค้นง่าย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (ระบบหน้าบ้าน)
- **โครงสร้างและรูปแบบ:** HTML5, CSS3, JavaScript (Vanilla)
- **สไตล์และการตกแต่ง:** Tailwind CSS (ผ่าน CDN)
- **ไอคอนและฟอนต์:** Lucide Icons, Google Fonts (Sarabun)
- **สถาปัตยกรรม:** แบบ Modular (แยก api.js, auth.js) และแบ่ง Dashboard ตาม Role

### Backend (ระบบหลังบ้าน)
- **Runtime & Framework:** Node.js, Express.js
- **ภาษา:** TypeScript
- **Database ORM:** Prisma
- **ฐานข้อมูล:** MySQL
- **ไลบรารีสำคัญ:** `jsonwebtoken` (JWT), `bcryptjs`, `cors`, `dotenv`

---

## ⚙️ โครงสร้างโปรเจกต์ (Project Structure)

```text
e:\gus\
├── backend/            # โค้ดส่วนหลังบ้าน (Node.js + Express + Prisma)
│   ├── prisma/         # Schema และ Migrations ของ Database
│   ├── src/            # Source Code ทั้งหมดของ API
│   │   ├── ...
│   │   └── index.ts    # จุดศูนย์กลางในการรัน Server
│   ├── .env            # ตั้งค่า Environment Variables (Database URL, JWT Secret)
│   └── package.json    # รายชื่อไลบรารีและสคริปต์ต่างๆ
└── frontend/           # โค้ดส่วนหน้าบ้าน (HTML/JS/CSS)
    ├── doctor/         # หน้าเว็บสำหรับแพทย์
    ├── patient/        # หน้าเว็บสำหรับผู้ป่วย
    ├── staff/          # หน้าเว็บสำหรับเจ้าหน้าที่
    ├── js/             # ไฟล์ JavaScript กลาง (api.js, auth.js)
    └── index.html      # หน้าแรก (Login / Register)
```

---

## 🚀 การติดตั้งและใช้งาน (Installation & Setup)

### ส่วนของ Backend

1. **เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `backend`**
   ```bash
   cd backend
   ```

2. **ติดตั้ง Dependencies ทั้งหมด**
   ```bash
   npm install
   ```

3. **ตั้งค่าไฟล์ `.env`**
   ตรวจสอบหรือแก้ไขไฟล์ `backend/.env` เพื่อตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/clinic_db"
   JWT_SECRET="your_secret_key"
   ```

4. **รัน Migration และสร้าง Prisma Client**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **เริ่มการทำงานของ Server**
   ```bash
   npm run dev
   ```
   > เซิร์ฟเวอร์จะรันอยู่ที่ `http://localhost:3000` (หรือพอร์ตที่กำหนดไว้)

### ส่วนของ Frontend

1. ไม่ต้องติดตั้ง Dependencies ใดๆ สามารถใช้ **Live Server** (Extension ใน VSCode) หรือเปิดไฟล์ HTML ตรงๆ ผ่านเบราว์เซอร์
2. เปิดไฟล์ `frontend/index.html` เพื่อเข้าสู่หน้าระบบลงทะเบียนและเข้าสู่ระบบ

---

## 📡 API Endpoints เบื้องต้น

- **Auth:**
  - `POST /api/auth/register` : สมัครสมาชิก
  - `POST /api/auth/login` : เข้าสู่ระบบเพื่อรับ Token
- **Patients:**
  - `GET /api/patients` : ดูรายชื่อผู้ป่วย (แพทย์และเจ้าหน้าที่)
  - `GET /api/patients/:id` : ดูข้อมูลการฉพาะบุคคล
- **Appointments:**
  - `POST /api/appointments` : สร้างการนัดหมาย
  - `GET /api/appointments` : ดูรายการนัดหมาย
  - `PATCH /api/appointments/:id/status` : อัปเดตสถานะนัดหมาย
- **Medical Records:**
  - `POST /api/medical-records` : เพิ่มเวชระเบียน (เฉพาะแพทย์)
  - `GET /api/medical-records/patient/:patientId` : ดูประวัติการรักษาทั้งหมดของผู้ป่วย

---

*Made for ClinicPro - Modern Clinic Management System* 💙
