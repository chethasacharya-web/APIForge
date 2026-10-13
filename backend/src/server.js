const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const { rateLimit } = require("express-rate-limit");
const apiRoutes = require("./routes/apiRoutes");
const app = express();

// General rate limit: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests. Please try again later."
    }
});

// Login rate limit: 5 requests per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many login attempts. Please try again later."
    }
});

app.use(cors());
app.use(express.json());

// General limit for API management endpoints
app.use("/api/apis", generalLimiter);
app.use("/api/apis", apiRoutes);
// Strict limit for login attempts
app.use("/api/auth/login", loginLimiter);

// General limit for other authentication endpoints
app.use("/api/auth", generalLimiter);

app.use("/api/auth", authRoutes);
// Basic server health check
app.get("/", (req, res) => {
    res.json({
        message: "APIForge backend is running"
    });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT DATABASE() AS database_name");

        res.status(200).json({
            status: "success",
            message: "MySQL connected successfully",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`APIForge backend running on port ${PORT}`);
});