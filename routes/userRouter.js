import express from "express";
import {
  register,
  login,
  logout,
  getUserProfile,
} from "../controllers/userController.js";
import {
  createInvitationCode,
  getAllInvitations,
  deleteInvitation,
} from "../controllers/invitationController.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Protected routes
router.get("/me", isAuthenticated, getUserProfile);

// Admin routes
router.post(
  "/invitation/create",
  isAuthenticated,
  isAdmin,
  createInvitationCode
);
router.get("/invitations", isAuthenticated, isAdmin, getAllInvitations);
router.delete("/invitation/:id", isAuthenticated, isAdmin, deleteInvitation);

export default router;
