"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const medicalRecord_routes_1 = __importDefault(require("./routes/medicalRecord.routes"));
const appointment_controller_1 = require("./controllers/appointment.controller");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Clinic Management System API' });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
// Manual override for delete since the router might be experiencing issues
app.delete('/api/appointments/:id', appointment_controller_1.deleteAppointment); // Import it first!
app.use('/api/medical-records', medicalRecord_routes_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
