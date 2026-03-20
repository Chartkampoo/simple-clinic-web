"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_1 = require("../controllers/patient.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Only STAFF and DOCTOR can see all patients
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['STAFF', 'DOCTOR']), patient_controller_1.getPatients);
// STAFF and DOCTOR can see details, PATIENT can see their own (logic handled in controller or by filtering)
router.get('/:id', auth_middleware_1.authenticate, patient_controller_1.getPatientById);
// Update profile
router.put('/:id', auth_middleware_1.authenticate, patient_controller_1.updatePatientProfile);
exports.default = router;
