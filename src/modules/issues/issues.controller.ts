import type { Request, Response } from "express";
import { issueService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
  const issue = await issueService.createIssueIntoDB(req.body);
};

export const issueController = {
  createIssue,
};
