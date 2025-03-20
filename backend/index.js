const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db"); // Import as a single function, not destructured

dotenv.config();

const app = express();
const port = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route - Define before DB connection since it doesn't need DB access
app.get("/", (req, res) => {
  res.send("🏥 Welcome to Barakaat Hospital Backend");
});

// Connect to MongoDB first
connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected!");

    // Import Routes only after DB is connected
    const userRoutes = require("./routes/user");
    //const doctorRoutes = require("./routes/doctors");
    //const patientRoutes = require("./routes/patients");
    //const appointmentRoutes = require("./routes/appointments");

    // Use Routes
    app.use("/api/users", userRoutes);
    //app.use("/api/doctors", doctorRoutes);
    //app.use("/api/patients", patientRoutes);
    //app.use("/api/appointments", appointmentRoutes);

    // Start Server
    app.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  });