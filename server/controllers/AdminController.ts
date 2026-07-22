import { Request, Response } from "express";
import User from "../models/User.js";

// GET /api/admin/users?search=name
export const getUsers = async (req: Request, res: Response) => {
    try {
        const search = (req.query.search as string)?.trim() || "";

        const filter = search
            ? { name: { $regex: search, $options: "i" } }
            : {};

        const [users, totalUsers] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 }),
            User.countDocuments(),
        ]);

        res.json({ totalUsers, users });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/admin/users/:id
export const editUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check email uniqueness if email is being changed
        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: "Email already in use" });
        }

        if (name     !== undefined) user.name     = name;
        if (email    !== undefined) user.email    = email;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        const updated = await User.findById(id).select("-password");
        res.json({ message: "User updated successfully", user: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};