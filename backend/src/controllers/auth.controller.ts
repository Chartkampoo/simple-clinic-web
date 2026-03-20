import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
  const { username, password, fullName, role, email, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await prisma.$transaction(async (tx) => {
      // Ensure email/phone are null if empty string is provided to avoid unique constraint issues
      const userData: any = {
        username,
        password: hashedPassword,
        fullName,
        role: role || 'PATIENT',
        email: email && email.trim() !== '' ? email : null,
        phone: phone && phone.trim() !== '' ? phone : null,
      };

      const user = await tx.user.create({
        data: userData,
      });

      if (user.role === 'PATIENT') {
        await tx.patientProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      return user;
    });

    res.status(201).json({ message: 'User created successfully', user: { id: result.id, username: result.username } });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ 
      where: { username },
      include: { patientProfile: { select: { id: true } } }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        specialization: user.specialization,
        experience: user.experience,
        patientProfileId: user.patientProfile?.id 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, fullName: true, username: true, profileImage: true, specialization: true, experience: true }
    });
    res.json(doctors);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลโปรไฟล์ (Profile Update Logic)
 * รองรับการอัปเดตทั้งคนไข้และแพทย์ (รวมถึงฟิลด์ความเชี่ยวชาญและประสบการณ์)
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // ดึง User ID จาก Token ที่ถูกถอดรหัสผ่าน Middleware
  
  // ดึงค่าใหม่ที่ส่งมาจาก Frontend ผ่าน Request Body
  const { fullName, email, phone, profileImage, specialization, experience } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // ใช้ Prisma ในการสั่ง Update ข้อมูลในฐานข้อมูล MySQL
    const user = await prisma.user.update({
      where: { id: userId }, // อัปเดตเฉพาะ Row ที่มี ID ตรงกับผู้ใช้งานที่ล็อกอินอยู่
      data: {
        fullName: fullName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        profileImage: profileImage || undefined,
        // ฟิลด์ใหม่ที่เราเพิ่มเข้าไปเพื่อเก็บข้อมูลเฉพาะของหมอ
        specialization: specialization || undefined,
        experience: experience || undefined
      }
    });

    // ส่งข้อมูลที่อัปเดตสำเร็จกลับไปหา Frontend
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        specialization: user.specialization,
        experience: user.experience,
        patientProfileId: req.body.patientProfileId
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
