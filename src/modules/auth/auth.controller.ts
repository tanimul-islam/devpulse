import type { Request, Response } from "express";
import { authServices } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/asyncHandler";

const signUpUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.createUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User Created successfully!",
    data: result.rows[0],
  });
});

const logInUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.logInUser(req.body);
  const { accessToken, refreshToken, user } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Log In Successful",
    data: {
      token: accessToken,
      user,
    },
  });
});

export const authController = {
  signUpUser,
  logInUser,
};
