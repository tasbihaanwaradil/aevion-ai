import express from "express";
import { updateTeacher } from "../controllers/TeacherController.js";
import { protectTeacher } from "../middlewares/auth.js";

const router = express.Router();

router.put("/update", protectTeacher, updateTeacher);

export default router;