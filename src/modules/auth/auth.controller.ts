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
    const result = await authServices.createUserIntoDB(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Log In Successful",
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

export const authController = {
  signUpUser,
  logInUser,
};
