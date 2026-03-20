"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientProfile = exports.getPatientById = exports.getPatients = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getPatients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patients = yield prisma_1.default.user.findMany({
            where: { role: 'PATIENT' },
            include: { patientProfile: true },
        });
        res.json(patients);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPatients = getPatients;
const getPatientById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const patient = yield prisma_1.default.patientProfile.findUnique({
            where: { id: Number(id) },
            include: {
                user: true,
                medicalRecords: {
                    include: { doctor: { select: { fullName: true } } }
                },
                patientAppointments: true
            },
        });
        if (!patient)
            return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPatientById = getPatientById;
const updatePatientProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { address, medicalHistory, allergies, birthDate, gender, idCardNumber } = req.body;
    try {
        const updated = yield prisma_1.default.patientProfile.update({
            where: { id: Number(id) },
            data: {
                address,
                medicalHistory,
                allergies,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                gender,
                idCardNumber,
            },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updatePatientProfile = updatePatientProfile;
