"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicalRecord_controller_1 = require("../controllers/medicalRecord.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Only doctors can create medical records
router.post('/', (0, auth_middleware_1.authorize)(['DOCTOR']), medicalRecord_controller_1.createMedicalRecord);
// Get records for a specific patient
router.get('/patient/:patientId', medicalRecord_controller_1.getPatientMedicalRecords);
exports.default = router;
