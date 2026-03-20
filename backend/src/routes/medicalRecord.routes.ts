import { Router } from 'express';
import { createMedicalRecord, getPatientMedicalRecords } from '../controllers/medicalRecord.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Only doctors can create medical records
router.post('/', authorize(['DOCTOR']), createMedicalRecord);

// Get records for a specific patient
router.get('/patient/:patientId', getPatientMedicalRecords);

export default router;
