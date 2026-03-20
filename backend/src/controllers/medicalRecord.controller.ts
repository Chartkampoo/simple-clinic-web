import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createMedicalRecord = async (req: AuthRequest, res: Response) => {
  const { patientId, diagnosis, treatment, medication, appointmentId } = req.body;
  const doctorId = req.user!.id;

  try {
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.medicalRecord.create({
        data: {
          patientId,
          doctorId,
          diagnosis,
          treatment,
          medication,
          appointmentId,
        },
      });

      // If linked to an appointment, mark it as completed
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      return newRecord;
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: Number(patientId) },
      include: {
        doctor: { select: { fullName: true } },
        appointment: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
