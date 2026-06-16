import { pool } from "../../db";
import {
  IssueType,
  type ICreateIssuePayload,
  type IIssue,
} from "./issues.interface";

const createIssueIntoDB = async (
  payload: ICreateIssuePayload,
  reporterId: number,
): Promise<IIssue> => {
  const { title, description, type } = payload;
  if (!title || title.trim().length === 0) throw new Error("Title is Required");
  if (title.length > 150) {
    throw new Error("Title cannot exceed 150 characters");
  }

  if (!description || description.trim().length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  if (!Object.values(IssueType).includes(type)) {
    throw new Error("Type must be either bug or feature_request");
  }
  const issue = await pool.query(
    `
INSERT INTO issues (title,description,type,reporter_id)
VALUES ($1,$2,$3,$4)
RETURNING *
`,
    [title, description, type, reporterId],
  );

  return issue.rows[0];
};

export const issueService = {
  createIssueIntoDB,
};
