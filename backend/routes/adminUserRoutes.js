
const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAdminUsers,
} = require("../controllers/adminUserController");

const router = express.Router();

// All routes in this router require an authenticated admin.
router.use(protect, adminOnly);

router.get("/", getAdminUsers);

module.exports = router;
