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
exports.getPatientMedicalRecords = exports.createMedicalRecord = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId, diagnosis, treatment, medication, appointmentId } = req.body;
    const doctorId = req.user.id;
    try {
        const record = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const newRecord = yield tx.medicalRecord.create({
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
                yield tx.appointment.update({
                    where: { id: appointmentId },
                    data: { status: 'COMPLETED' },
                });
            }
            return newRecord;
        }));
        res.status(201).json(record);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createMedicalRecord = createMedicalRecord;
const getPatientMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    try {
        const records = yield prisma_1.default.medicalRecord.findMany({
            where: { patientId: Number(patientId) },
            include: {
                doctor: { select: { fullName: true } },
                appointment: true,
            },
            orderBy: { recordedAt: 'desc' },
        });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPatientMedicalRecords = getPatientMedicalRecords;
