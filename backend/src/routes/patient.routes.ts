import { Router } from 'express';
import { getPatientById, getPatients, updatePatientProfile } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Only STAFF and DOCTOR can see all patients
router.get('/', authenticate, authorize(['STAFF', 'DOCTOR']), getPatients);

// STAFF and DOCTOR can see details, PATIENT can see their own (logic handled in controller or by filtering)
router.get('/:id', authenticate, getPatientById);

// Update profile
router.put('/:id', authenticate, updatePatientProfile);

export default router;
