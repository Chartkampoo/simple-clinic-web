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
exports.getDoctors = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, fullName, role, email, phone } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Ensure email/phone are null if empty string is provided to avoid unique constraint issues
            const userData = {
                username,
                password: hashedPassword,
                fullName,
                role: role || 'PATIENT',
                email: email && email.trim() !== '' ? email : null,
                phone: phone && phone.trim() !== '' ? phone : null,
            };
            const user = yield tx.user.create({
                data: userData,
            });
            if (user.role === 'PATIENT') {
                yield tx.patientProfile.create({
                    data: {
                        userId: user.id,
                    },
                });
            }
            return user;
        }));
        res.status(201).json({ message: 'User created successfully', user: { id: result.id, username: result.username } });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { username, password } = req.body;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { username },
            include: { patientProfile: { select: { id: true } } }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const isValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValid)
            return res.status(401).json({ message: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                patientProfileId: (_a = user.patientProfile) === null || _a === void 0 ? void 0 : _a.id
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.login = login;
const getDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctors = yield prisma_1.default.user.findMany({
            where: { role: 'DOCTOR' },
            select: { id: true, fullName: true, username: true }
        });
        res.json(doctors);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getDoctors = getDoctors;
