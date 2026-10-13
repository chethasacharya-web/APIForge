const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check whether the Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required"
        });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    try {
        // Verify signature and expiration
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach authenticated user information to the request
        req.user = decoded;

        // Continue to the protected route
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authenticateToken;