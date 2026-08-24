import express from "express";
import { updateUser } from "../controllers/UserControllers.js";

const router = express.Router();

router.put("/update", updateUser);

export default router;
