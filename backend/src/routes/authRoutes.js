const express = require("express");

const {
    register,
    login
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/me", authenticateToken, (req, res) => {
    res.status(200).json({
        message: "Authentication successful",
        user: {
            id: req.user.id,
            role: req.user.role
        }
    });
});

module.exports = router;