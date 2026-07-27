const express = require("express");
const router = express.Router();
const Role = require("../models/Role");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const User = require("../models/User");

// ✅ Create a new role
router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        // Check duplicate
        const existing = await Role.findOne({ name: name.trim() });
        if (existing)
            return res
                .status(400)
                .json({ success: false, message: "Role name already exists" });

        const role = await Role.create({
            name: name.trim(),
            description,
            permissions: permissions || [],
        });

        res.status(201).json({ success: true, message: "Role created", role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error creating role" });
    }
});

// ✅ Get all roles
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const roles = await Role.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, roles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching roles" });
    }
});

// ✅ Update role
router.put("/:id", isAuthenticated, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        const updated = await Role.findByIdAndUpdate(
            req.params.id,
            { name, description, permissions },
            { new: true }
        );

        if (!updated)
            return res.status(404).json({ success: false, message: "Role not found" });

        res.status(200).json({ success: true, message: "Role updated", updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error updating role" });
    }
});

// ✅ Delete role
router.delete("/:id", isAuthenticated, isAdmin("admin"), async (req, res) => {
    try {
        const deleted = await Role.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: "Role not found" });

        res.status(200).json({ success: true, message: "Role deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error deleting role" });
    }
});



// ✅ PUT /users/:id/role
router.put("/users/:id/role", async (req, res) => {
    try {
        const { roleId } = req.body;
        const id = req.params.id;

        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ message: "Role not found" });

        const user = await User.findByIdAndUpdate(
            id,
            { role: roleId },
            { new: true }
        ).populate("role");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User role updated", user });
    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
