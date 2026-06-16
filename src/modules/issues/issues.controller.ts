import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.id;

    if (!reporterId) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        error: {
          message: "User Information is not found in token",
        },
      });
    }

    const result = await issueService.createIssueIntoDB(req.body, reporterId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue Created Successfully",
      data: result,
    });
  } catch (error: unknown) {
    const errorMessagge =
      error instanceof Error ? error.message : "Something Went Wrong";

    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: errorMessagge,
      error: {
        message: errorMessagge,
      },
    });
  }
};

const getAllISues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues Retrived Successfully",
      data: result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";

    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: errorMessage,
      error: {
        message: errorMessage,
      },
    });
  }
};

export const issueController = {
  createIssue,
  getAllISues,
};
