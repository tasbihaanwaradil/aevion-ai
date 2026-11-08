import { Request, Response } from "express";
import Teacher from "../models/Teacher.js";

// Same validation rules as the old general-user version.
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

// PUT /api/teacher/update
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;
    let { name } = req.body;

    if (!teacherId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    name = (name ?? "").trim();

    if (!validateUsername(name)) {
      return res.status(400).json({
        message:
          "Invalid name. Use 2–64 characters, letters/numbers/spaces only.",
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Case-insensitive uniqueness check, scoped to teachers only.
    const existingTeacher = await Teacher.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingTeacher && existingTeacher._id.toString() !== teacherId) {
      return res.status(409).json({
        message: "That name is already taken.",
      });
    }

    teacher.name = name;
    await teacher.save();

    return res.json({
      message: "Profile updated successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
      },
    });

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};