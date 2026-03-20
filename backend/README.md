# Clinic Management System Backend API

Backend API for managing a clinic and patients using Express.js, Prisma, and MySQL.

## Features
- **3 Roles**: DOCTOR, STAFF, PATIENT
- **Auth**: JWT based Authentication & Authorization
- **Patient Management**: Profiles and history
- **Medical Records**: Diagnosis, treatment, and medication logic
- **Appointment System**: Booking and status tracking

## Prerequisites
- Node.js installed
- MySQL Database running

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Database:**
   Update the `.env` file with your MySQL connection string:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/clinic_db"
   JWT_SECRET="your_secret_key"
   ```

3. **Run Database Migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

## API Routes

- **Auth**:
  - `POST /api/auth/register`: Create new user
  - `POST /api/auth/login`: Authenticate and get token

- **Patients**:
  - `GET /api/patients`: List all patients (Staff/Doctor)
  - `GET /api/patients/:id`: Get patient details
  - `PUT /api/patients/:id`: Update patient profile

- **Appointments**:
  - `POST /api/appointments`: Create appointment
  - `GET /api/appointments`: List appointments (filtered by role)
  - `PATCH /api/appointments/:id/status`: Update status (PENDING, COMPLETED, CANCELLED)

- **Medical Records**:
  - `POST /api/medical-records`: Create record (Doctor only)
  - `GET /api/medical-records/patient/:patientId`: Get patient's medical history
