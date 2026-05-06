import { Request, Response } from "express";
import User from "../models/User.js";

// Username validator
const validateUsername = (username: string) => {
  if (!username) return false;

  const cleaned = username.trim();

  // 1. Length check (2–64 chars)
  if (cleaned.length < 2 || cleaned.length > 64) return false;

  // 2. Allowed characters (letters, numbers, ., _, -, and SPACE)
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9._\- ]{1,63}$/;
  if (!regex.test(cleaned)) return false;

  // 3. No multiple spaces
  if (/\s{2,}/.test(cleaned)) return false;

  // 4. Reject spam like "aaaaaa"
  if (/(.)\1{4,}/.test(cleaned)) return false;

  // 5. Must contain at least one letter
  if (!/[a-zA-Z]/.test(cleaned)) return false;

  return true;
};

// Update User Controller
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    let { name } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Trim name before validation
    name = name.trim();

    // Validate username
    if (!validateUsername(name)) {
      return res.status(400).json({
        message:
          "Invalid username. Use 2–64 characters, letters/numbers/spaces only.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Case-insensitive uniqueness check
    const existingUser = await User.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({
        message: "Username already taken",
      });
    }

    // Update
    user.name = name;
    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};