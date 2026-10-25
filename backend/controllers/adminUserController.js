
const User = require("../models/User");

// GET /api/admin/users
const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const role =
      typeof req.query.role === "string"
        ? req.query.role.trim()
        : "";

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

   if (role === "customer") {
  // Include older accounts that used the role "user".
  filter.role = { $in: ["customer", "user"] };
} else if (role === "admin") {
  filter.role = "admin";
}

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("name email role isActive createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminUsers,
};
