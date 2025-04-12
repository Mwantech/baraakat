require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const userRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const appointmentRoutes = require("./routes/appointmentsRoutes");
const prescriptionRoutes = require("./routes/prescriptionsRoutes");
const patientRoutes = require("./routes/patientsRoutes");
const medicalRecordsRoutes = require("./routes/medicalRecordsRoutes");
const dashboardStatsRoutes = require("./routes/dashboardstatsRoutes");
const MpesaRooutes = require("./routes/mpesaRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Add to your main Express app before route definitions
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/auth", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/medical-records", medicalRecordsRoutes);
app.use("/api/dashboard", dashboardStatsRoutes);
app.use("/api/payments", MpesaRooutes);

// Root Route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });
  
// Start Server
const PORT = process.env.PORT || 5500;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
