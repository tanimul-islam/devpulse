import type { Request, Response } from "express";
import { authServices } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const result = await authServices.createUserIntoDB(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User Created Successfuly!",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Error";

    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Something Went Wrong",
      error: {
        message: errorMessage,
      },
    });
  }
};

const logInUser = async (req: Request, res: Response) => {
  try {
    const result = await authServices.logInUser(req.body);
    const { accessToken, refreshToken, user } = result;

    res.cookie("refreshToken", refreshToken, {
      secure: false,
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";

    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: errorMessage,
      error: { message: errorMessage },
    });
  }
};

export const authController = {
  signUpUser,
  logInUser,
};
