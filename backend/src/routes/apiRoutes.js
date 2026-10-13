const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
    createApi,
    getApis,
    getApiById,
    updateApi,
    deleteApi,
    executeApi
} = require("../controllers/apiController");
const router = express.Router();

// Protect every route in this router
router.use(authenticateToken);

router.post("/", createApi);
router.get("/", getApis);
router.get("/:id", getApiById);
router.put("/:id", updateApi);
router.delete("/:id", deleteApi);
router.post("/:id/execute", executeApi);
module.exports = router;