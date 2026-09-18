import { Router } from "express";
import { protectTeacher } from "../middlewares/protectTeacher.js"; // swap for your existing session-guard middleware if you have one
import {
  createReminder,
  getReminders,
  getToday,
  getUpcoming,
  getOverdue,
  getMostUrgent,
  updateReminder,
  completeReminder,
  deleteReminder,
  checkDuplicate,
} from "../controllers/Remindercontroller.js";

const router = Router();

// Every reminder route is scoped to the authenticated teacher.
router.use(protectTeacher);

router.get("/", getReminders); // supports ?completed=true for the Completed tab
router.get("/today", getToday);
router.get("/upcoming", getUpcoming);
router.get("/overdue", getOverdue);
router.get("/urgent", getMostUrgent);
router.get("/check-duplicate", checkDuplicate);

router.post("/", createReminder);

router.patch("/:id", updateReminder);
router.patch("/:id/complete", completeReminder);

router.delete("/:id", deleteReminder);

export default router;