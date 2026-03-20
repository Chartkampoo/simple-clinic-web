import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * สร้างรายการนัดหมายใหม่ (Create Appointment / Follow-up)
 * ใช้ทั้งตอนคนไข้จองเอง และตอนที่คุณหมอนัดตรวจครั้งถัดไป (Follow-up)
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
  const { patientId, doctorId, appointmentDate, reason } = req.body;

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate), // แปลงข้อมูลวันที่ให้เป็นรูปแบบที่ DB รองรับ
        reason,
        status: 'PENDING', // กำหนดสถานะเริ่มต้นเป็น 'รอดำเนินการ'
      },
    });
    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * ดึงรายการนัดหมาย (Get Appointments with Role-based filtering)
 * - ถ้าเป็นหมอ: เห็นเฉพาะคิวที่ต้องตรวจของตัวเอง
 * - ถ้าเป็นคนไข้: เห็นเฉพาะรายการนัดของตัวเอง
 */
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id } = req.user!;
    let where = {};

    // ตรวจสอบสิทธิ์ (Role Check) เพื่อกรองข้อมูลให้ถูกต้อง
    if (role === 'DOCTOR') {
      where = { doctorId: id }; // กรองตาม ID หมอ
    } else if (role === 'PATIENT') {
      // ค้นหาโปรไฟล์คนไข้ก่อนเพื่อเอา ID ไปกรองรายการนัด
      const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
      if (!profile) return res.status(404).json({ message: 'ไม่พบโปรไฟล์คนไข้' });
      where = { patientId: profile.id };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        // ดึงข้อมูลชื่อคนไข้และคุณหมอมาแสดงผลพร้อมกันด้วย (Eager Loading)
        patient: { include: { user: { select: { fullName: true, profileImage: true } } } },
        doctor: { select: { fullName: true } },
      },
      orderBy: { appointmentDate: 'asc' }, // เรียงลำดับตามวันที่นัดจากเร็วไปช้า
    });
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * อัปเดตสถานะการนัดหมาย (Update Status)
 * เช่น เปลี่ยนจาก PENDING (รอตรวจ) เป็น COMPLETED (ตรวจเสร็จแล้ว)
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * ยกเลิกรายการนัดหมาย (Delete Appointment)
 * มีระบบตรวจสอบสิทธิ์ว่าผู้ลบเป็นเจ้าของรายการนัดนั้นจริงๆ หรือไม่
 */
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role, id: userId } = req.user!;
  
  try {
    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    // 1. ค้นหาข้อมูลนัดหมายเพื่อเช็คสิทธิ์ก่อนลบ
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) return res.status(404).json({ message: 'ไม่พบรายการนัดหมาย' });

    // 2. ตรวจสอบสิทธิ์ (Permission Check)
    if (role === 'DOCTOR' && appointment.doctorId !== userId) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบรายการนัดของหมอท่านอื่น' });
    }
    
    if (role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId } });
      if (!profile || appointment.patientId !== profile.id) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบรายการนัดของผู้อื่น' });
      }
    }

    // 3. ทำการลบข้อมูลจริงออกจากฐานข้อมูล
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(400).json({ message: error.message });
  }
};
