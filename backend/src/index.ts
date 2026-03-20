import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import { deleteAppointment } from './controllers/appointment.controller';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Clinic Management System API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
// Manual override for delete since the router might be experiencing issues
app.delete('/api/appointments/:id', deleteAppointment); // Import it first!
app.use('/api/medical-records', medicalRecordRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
