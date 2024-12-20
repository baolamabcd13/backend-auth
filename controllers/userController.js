import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { Invitation } from "../models/invitationSchema.js";
import { generateToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, password, invitationCode } = req.body;

  // Kiểm tra xem có user nào trong hệ thống chưa
  const isFirstAccount = (await User.countDocuments({})) === 0;

  // Nếu là account đầu tiên
  if (isFirstAccount) {
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "Admin",
    });

    return generateToken(user, "Admin registered successfully", 201, res);
  }

  // Nếu không phải account đầu tiên
  if (!invitationCode) {
    return next(new ErrorHandler("Invitation code is required", 400));
  }

  // Verify invitation code
  const invitation = await Invitation.findOne({
    code: invitationCode,
    used: false,
  });

  if (!invitation) {
    return next(new ErrorHandler("Invalid invitation code", 400));
  }

  // Kiểm tra hết hạn
  if (Date.now() > invitation.expiresAt) {
    return next(new ErrorHandler("Invitation code has expired", 400));
  }

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "Editor",
  });

  // Mark invitation as used
  invitation.used = true;
  await invitation.save();

  generateToken(user, "Registration successful", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  generateToken(user, "Login successful", 200, res);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });
});

export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});
