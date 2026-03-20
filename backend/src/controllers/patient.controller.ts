import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * ดึงรายชื่อคนไข้ทั้งหมด (Doctors look here)
 * ใช้สำหรับแสดงในตารางทะเบียนประวัติผู้ป่วยของคุณหมอ
 */
export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    // ใช้ Prisma ค้นหา User ทุกคนที่มีบทบาทเป็น 'PATIENT'
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: { patientProfile: true }, // ดึงข้อมูลโปรไฟล์คนไข้เพิ่มเติม (เช่น ที่อยู่, ประวัติแพ้ยา)
    });
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ดึงข้อมูลรายละเอียดของคนไข้รายบุคคล (Patient Detail Lookup)
 * ดึงมาทั้งข้อมูลส่วนตัว, ประวัติการรักษา (Medical Records), และรายการนัดหมาย (Appointments)
 */
export const getPatientById = async (req: Request, res: Response) => {
  const { id } = req.params; // รับรหัส ID จาก URL Parameter
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: Number(id) },
      include: {
        user: true, // ดึงข้อมูลพื้นฐาน (ชื่อ, อีเมล, โทรศัพท์)
        medicalRecords: { // ดึงประวัติการรักษาทั้งหมด
          include: { doctor: { select: { fullName: true } } } // แสดงชื่อหมอที่ทำการรักษาวันนั้นด้วย
        },
        patientAppointments: true // ดึงรายการการนัดหมายทั้งหมด
      },
    });
    if (!patient) return res.status(404).json({ message: 'ไม่พบข้อมูลคนไข้รายนี้' });
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * อัปเดตข้อมูลทางการแพทย์ (Medical Data Update)
 */
export const updatePatientProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { address, medicalHistory, allergies, birthDate, gender, idCardNumber } = req.body;

  try {
    // บันทึกข้อมูลที่แก้ไขใหม่ลงฐานข้อมูลตาม ID
    const updated = await prisma.patientProfile.update({
      where: { id: Number(id) },
      data: {
        address,
        medicalHistory,
        allergies,
        birthDate: birthDate ? new Date(birthDate) : undefined, // ต้องแปลงค่าวันที่ให้เป็น Object ของ JavaScript
        gender,
        idCardNumber,
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
