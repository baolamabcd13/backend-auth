import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Invitation } from "../models/invitationSchema.js";
import crypto from "crypto";

export const createInvitationCode = catchAsyncErrors(async (req, res, next) => {
  // Tạo code ngẫu nhiên (6 ký tự)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Set thời gian hết hạn là 15 phút từ thời điểm tạo
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const invitation = await Invitation.create({
    code,
    expiresAt,
    createdBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    code: invitation.code,
    expiresAt: invitation.expiresAt,
    message: "Invitation code created successfully (valid for 15 minutes)",
  });
});

export const getAllInvitations = catchAsyncErrors(async (req, res, next) => {
  const invitations = await Invitation.find()
    .populate("createdBy", "firstName lastName email")
    .sort("-createdAt");

  // Thêm trạng thái expired vào response
  const invitationsWithStatus = invitations.map((inv) => ({
    ...inv.toObject(),
    isExpired: Date.now() > inv.expiresAt,
    timeLeft: Math.max(0, inv.expiresAt - Date.now()), // milliseconds remaining
  }));

  res.status(200).json({
    success: true,
    invitations: invitationsWithStatus,
  });
});

export const deleteInvitation = catchAsyncErrors(async (req, res, next) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    return next(new ErrorHandler("Invitation not found", 404));
  }

  if (invitation.used) {
    return next(new ErrorHandler("Cannot delete used invitation", 400));
  }

  await invitation.remove();

  res.status(200).json({
    success: true,
    message: "Invitation deleted successfully",
  });
});
