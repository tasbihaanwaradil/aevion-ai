import express from "express";
import { getUsers, deleteUser, editUser } from "../controllers/AdminController.js";
import protect from "../middlewares/auth.js";

const AdminRouter = express.Router();

AdminRouter.get("/users",          protect, getUsers);
AdminRouter.delete("/users/:id",   protect, deleteUser);
AdminRouter.patch("/users/:id",    protect, editUser);

export default AdminRouter;