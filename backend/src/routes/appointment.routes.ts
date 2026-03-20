import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus, deleteAppointment } from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.delete('/:id', deleteAppointment);
router.post('/', createAppointment);
router.get('/', getAppointments);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
