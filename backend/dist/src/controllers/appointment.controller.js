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
exports.deleteAppointment = exports.updateAppointmentStatus = exports.getAppointments = exports.createAppointment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId, doctorId, appointmentDate, reason } = req.body;
    try {
        const appointment = yield prisma_1.default.appointment.create({
            data: {
                patientId,
                doctorId,
                appointmentDate: new Date(appointmentDate),
                reason,
                status: 'PENDING',
            },
        });
        res.status(201).json(appointment);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createAppointment = createAppointment;
const getAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, id } = req.user;
        let where = {};
        if (role === 'DOCTOR') {
            where = { doctorId: id };
        }
        else if (role === 'PATIENT') {
            // Find patient profile first
            const profile = yield prisma_1.default.patientProfile.findUnique({ where: { userId: id } });
            if (!profile)
                return res.status(404).json({ message: 'Patient profile not found' });
            where = { patientId: profile.id };
        }
        const appointments = yield prisma_1.default.appointment.findMany({
            where,
            include: {
                patient: { include: { user: { select: { fullName: true } } } },
                doctor: { select: { fullName: true } },
            },
            orderBy: { appointmentDate: 'asc' },
        });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAppointments = getAppointments;
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updated = yield prisma_1.default.appointment.update({
            where: { id: Number(id) },
            data: { status },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
const deleteAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log('Attempting to delete appointment:', id);
    try {
        const appointmentId = Number(id);
        if (isNaN(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }
        yield prisma_1.default.appointment.delete({
            where: { id: appointmentId },
        });
        res.json({ message: 'Appointment deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(400).json({ message: error.message });
    }
});
exports.deleteAppointment = deleteAppointment;
