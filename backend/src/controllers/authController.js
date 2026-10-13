const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        // 3. Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters"
            });
        }

        // 4. Normalize name and email
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName) {
            return res.status(400).json({
                message: "Name cannot be empty"
            });
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 6. Insert user into MySQL
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [normalizedName, normalizedEmail, hashedPassword]
        );

        // 8. Return success
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: result.insertId,
                name: normalizedName,
                email: normalizedEmail
            }
        });

    } catch (error) {
        // Duplicate email
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // 2. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 3. Find user in MySQL
        const [users] = await pool.execute(
            "SELECT id, name, email, password, role FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // 4. Compare password with stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 5. Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        // 6. Return token and user details
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
module.exports = { register, login };