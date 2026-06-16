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
const updateIssue = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);
    if (!Number.isInteger(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid Issue ID",
      });
    }

    if (!req.user) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access",
      });
    }

    const result = await issueService.UpdateIssueinDB(
      issueId,
      req.body,
      req.user,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "issue Updated Succesfully",
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    const statusCode = errorMessage.includes("Forbidden")
      ? 403
      : errorMessage.includes("not found")
        ? 404
        : 400;
    sendResponse(res, {
      statusCode,
      success: false,
      message: errorMessage,
      error: {
        message: errorMessage,
      },
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);
    if (!Number.isInteger(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid Issue ID",
      });
    }
    if (!req.user) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access",
      });
    }
    const result = await issueService.deleteIssueFromDB(issueId, req.user);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "issue Deleted Succesfully",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    const statusCode = errorMessage.includes("Forbidden")
      ? 403
      : errorMessage.includes("not found")
        ? 404
        : 400;
    sendResponse(res, {
      statusCode,
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
  updateIssue,
  deleteIssue,
};
