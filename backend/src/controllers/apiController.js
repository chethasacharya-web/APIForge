const pool = require("../config/db");
// Track rate limits for API execution
const apiRateLimitStore = new Map();


// CREATE an API
async function createApi(req, res) {

    try {
        const {
            name,
            description,
            base_url,
            method,
            rateLimitEnabled = true,
            rateLimitMax = 100,
            rateLimitWindowMinutes = 15
        } = req.body;
        if (
            typeof rateLimitEnabled !== "boolean" ||
            !Number.isInteger(rateLimitMax) ||
            rateLimitMax < 1 ||
            rateLimitMax > 10000 ||
            ![1, 5, 15, 30, 60].includes(rateLimitWindowMinutes)
        ) {
            return res.status(400).json({
                message: "Invalid rate-limit settings"
            });
        }
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof base_url !== "string" ||
            !base_url.trim() ||
            typeof method !== "string"
        ) {
            return res.status(400).json({
                message: "Name, base_url, and method are required"
            });
        }

        const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
        const normalizedMethod = method.trim().toUpperCase();

        if (!allowedMethods.includes(normalizedMethod)) {
            return res.status(400).json({
                message: "Invalid HTTP method"
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(base_url.trim());
        } catch {
            return res.status(400).json({
                message: "Invalid URL"
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: "URL must use HTTP or HTTPS"
            });
        }

        const normalizedName = name.trim();

        if (normalizedName.length > 100 || parsedUrl.toString().length > 500) {
            return res.status(400).json({
                message: "Name or URL exceeds the allowed length"
            });
        }

        const normalizedDescription =
            typeof description === "string" ? description.trim() : null;

        const [result] = await pool.execute(
            `INSERT INTO apis
(
    user_id,
    name,
    description,
    base_url,
    method,
    rate_limit_enabled,
    rate_limit_max,
    rate_limit_window_minutes
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                normalizedName,
                normalizedDescription,
                parsedUrl.toString(),
                normalizedMethod,
                rateLimitEnabled ? 1 : 0,
                rateLimitMax,
                rateLimitWindowMinutes
            ]
        );

        return res.status(201).json({
            message: "API registered successfully",
            api: {
                id: result.insertId,
                user_id: req.user.id,
                name: normalizedName,
                description: normalizedDescription,
                base_url: parsedUrl.toString(),
                method: normalizedMethod,
                rate_limit_enabled: rateLimitEnabled,
                rate_limit_max: rateLimitMax,
                rate_limit_window_minutes: rateLimitWindowMinutes
            }
        });
    } catch (error) {
        console.error("Create API error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// READ all APIs belonging to the authenticated user
// READ all APIs belonging to the authenticated user
async function getApis(req, res) {
    try {
        const [apis] = await pool.execute(
            `SELECT
                id,
                name,
                description,
                base_url,
                method,
                rate_limit_enabled,
                rate_limit_max,
                rate_limit_window_minutes,
                created_at
             FROM apis
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            count: apis.length,
            apis
        });
    } catch (error) {
        console.error("Get APIs error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// READ one API
async function getApiById(req, res) {
    try {
        const [apis] = await pool.execute(
            `SELECT id, name, description, base_url, method, created_at
             FROM apis
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (apis.length === 0) {
            return res.status(404).json({
                message: "API not found"
            });
        }

        return res.status(200).json({
            api: apis[0]
        });
    } catch (error) {
        console.error("Get API error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// UPDATE an API
async function updateApi(req, res) {
    try {
        const { name, description, base_url, method } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof base_url !== "string" ||
            !base_url.trim() ||
            typeof method !== "string"
        ) {
            return res.status(400).json({
                message: "Name, base_url, and method are required"
            });
        }

        const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
        const normalizedMethod = method.trim().toUpperCase();

        if (!allowedMethods.includes(normalizedMethod)) {
            return res.status(400).json({
                message: "Invalid HTTP method"
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(base_url.trim());
        } catch {
            return res.status(400).json({
                message: "Invalid URL"
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: "URL must use HTTP or HTTPS"
            });
        }

        const normalizedName = name.trim();

        if (normalizedName.length > 100 || parsedUrl.toString().length > 500) {
            return res.status(400).json({
                message: "Name or URL exceeds the allowed length"
            });
        }

        const normalizedDescription =
            typeof description === "string" ? description.trim() : null;

        const [result] = await pool.execute(
            `UPDATE apis
             SET name = ?, description = ?, base_url = ?, method = ?
             WHERE id = ? AND user_id = ?`,
            [
                normalizedName,
                normalizedDescription,
                parsedUrl.toString(),
                normalizedMethod,
                req.params.id,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "API not found"
            });
        }

        return res.status(200).json({
            message: "API updated successfully"
        });
    } catch (error) {
        console.error("Update API error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// DELETE an API
async function deleteApi(req, res) {
    try {
        const [result] = await pool.execute(
            `DELETE FROM apis
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "API not found"
            });
        }

        return res.status(200).json({
            message: "API deleted successfully"
        });
    } catch (error) {
        console.error("Delete API error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
async function executeApi(req, res) {
    console.log("EXECUTE API CALLED - ID:", req.params.id);
    try {
        const { id } = req.params;
        console.log("Execute API request:", {
            requestedId: req.params.id,
            authenticatedUserId: req.user.id
        });
        // Find the API registered by the logged-in user
        const [apis] = await pool.execute(

            `SELECT
    id,
    name,
    base_url,
    method,
    rate_limit_enabled,
    rate_limit_max,
    rate_limit_window_minutes
FROM apis
WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        
        console.log("Database lookup result:", apis);

        if (apis.length === 0) {
            return res.status(404).json({
                message: "API not found"
            });
        }

        const registeredApi = apis[0];

        // Enforce the configured rate limit
        if (registeredApi.rate_limit_enabled) {
            const key = `${req.user.id}:${registeredApi.id}`;
            const now = Date.now();
            const windowMs =
                registeredApi.rate_limit_window_minutes * 60 * 1000;

            let record = apiRateLimitStore.get(key);

            // Start a new window when the previous one expires
            if (!record || now - record.windowStart >= windowMs) {
                record = {
                    windowStart: now,
                    count: 0
                };
            }

            if (record.count >= registeredApi.rate_limit_max) {
                const retryAfterSeconds = Math.ceil(
                    (record.windowStart + windowMs - now) / 1000
                );

                apiRateLimitStore.set(key, record);

                return res
                    .set("Retry-After", String(retryAfterSeconds))
                    .status(429)
                    .json({
                        message: "Rate limit exceeded for this API",
                        limit: registeredApi.rate_limit_max,
                        windowMinutes:
                            registeredApi.rate_limit_window_minutes,
                        retryAfterSeconds
                    });
            }

            record.count += 1;
            apiRateLimitStore.set(key, record);
        }

        const startTime = Date.now();

        // Execute the external API
        const response = await fetch(registeredApi.base_url, {
            method: registeredApi.method,
            signal: AbortSignal.timeout(10000)
        });

        const contentType = response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        return res.status(200).json({
            message: "API executed successfully",
            response: {
                status: response.status,
                success: response.ok,
                duration: Date.now() - startTime,
                data
            }
        });

    } catch (error) {
        console.error("API execution error:", error);
        console.error("Error cause:", error.cause);

        return res.status(502).json({
            message: "Failed to execute the registered API",
            details: error.message,
            cause: error.cause?.message || null
        });
    }
}
module.exports = {
    createApi,
    getApis,
    getApiById,
    updateApi,
    deleteApi,
    executeApi
};