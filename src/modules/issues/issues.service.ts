import { pool } from "../../db";
import ApiError from "../../utils/apiError";
import {
  IssueStatus,
  IssueType,
  type ICreateIssuePayload,
  type IIssue,
  type IUpdatePayload,
  type TAuthenticatedUser,
  type TGetIssueQuery,
  type TIssueReporter,
  type TIssueWithReporter,
} from "./issues.interface";
import { issueRoute } from "./issues.route";

const createIssueIntoDB = async (
  payload: ICreateIssuePayload,
  reporterId: number,
): Promise<IIssue> => {
  const { title, description, type } = payload;
  if (!title || title.trim().length === 0)
    throw new ApiError(401, "Title is Required");
  if (title.length > 150) {
    throw new ApiError(400, "Title cannot exceed 150 characters");
  }

  if (!description || description.trim().length < 20) {
    throw new ApiError(400, "Description must be at least 20 characters");
  }

  if (!Object.values(IssueType).includes(type)) {
    throw new ApiError(400, "Type must be either bug or feature_request");
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

const getAllIssuesFromDB = async (
  query: TGetIssueQuery,
): Promise<TIssueWithReporter[]> => {
  const { sort = "newest", type, status } = query;

  const conditions: string[] = [];
  const values: string[] = [];

  if (sort !== "newest" && sort !== "oldest")
    throw new ApiError(409, "Sort must be either newest or oldest");

  if (type) {
    if (!Object.values(IssueType).includes(type as IssueType)) {
      throw new ApiError(409, "Type must be either bug or feature request");
    }

    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (status) {
    if (!Object.values(IssueStatus).includes(status as IssueStatus)) {
      throw new ApiError(409, "Status must be open, in progress, or resolved");
    }

    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const orderDirection = sort === "oldest" ? "ASC" : "DESC";
  const whereQuery =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const issueResult = await pool.query<IIssue>(
    `
       SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues
       ${whereQuery}
       ORDER BY created_at  ${orderDirection}
        `,
    values,
  );
  const issues = issueResult.rows;

  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))]; //moving duplicate,collection reporter if

  const reporterResult = await pool.query<TIssueReporter>(
    `
    SELECT id,name,role
    FROM users
    WHERE id = ANY($1::int[])
    `,
    [reporterIds],
  );
  const reporterMap = new Map<number, TIssueReporter>();

  reporterResult.rows.forEach((reporter) => {
    reporterMap.set(reporter.id, reporter);
  });

  const issuesWithReporter = issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;

    return {
      ...issueData,
      reporter: reporterMap.get(reporter_id) || null,
    };
  });

  return issuesWithReporter;
};

const UpdateIssueinDB = async (
  issueId: number,
  payload: IUpdatePayload,
  user: TAuthenticatedUser,
): Promise<IIssue> => {
  const { title, description, type } = payload;
  if (!title && !description && !type) {
    throw new Error("At least one field is required to update");
  }

  if (title !== undefined && title.trim().length === 0) {
    throw new ApiError(400, "Title cannot be empty");
  }

  if (title !== undefined && title.length > 150) {
    throw new ApiError(400, "Title cannot exceed 150 characters");
  }

  if (description !== undefined && description.trim().length < 20) {
    throw new ApiError(400, "Description must be at least 20 characters");
  }

  if (type !== undefined && !Object.values(IssueType).includes(type)) {
    throw new ApiError(400, "Type must be either bug or feature_request");
  }

  const existingIssueResult = await pool.query<IIssue>(
    `
    SELECT * FROM issues
    WHERE id = $1
    LIMIT 1
    `,
    [issueId],
  );

  const existingIssues = existingIssueResult.rows[0];

  if (!existingIssues) throw new ApiError(400, "Issues not found!");

  if (user.role === "contributor") {
    if (existingIssues.reporter_id != user.id)
      throw new ApiError(409, "You can only update your own issue");

    if (existingIssues.status !== IssueStatus.open)
      throw new ApiError(409, "You can only update an open issue");
  }

  const updateResult = await pool.query<IIssue>(
    `
  UPDATE issues
  SET
  title = COALESCE ($1,title),
  description = COALESCE($2, description),
  type = COALESCE($3, type),
  updated_at = NOW()
  WHERE id=$4
  RETURNING *
`,
    [
      title ? title.trim() : null,
      description ? description.trim() : null,
      type || null,
      issueId,
    ],
  );
  const updatedIssue = updateResult.rows[0];

  if (!updatedIssue) {
    throw new ApiError(400, "Failed to update issue");
  }

  return updatedIssue;
};

const deleteIssueFromDB = async (issueId: number, user: TAuthenticatedUser) => {
  const existingIssueResult = await pool.query<IIssue>(
    `
    SELECT * FROM issues
    WHERE id = $1
    LIMIT 1
    `,
    [issueId],
  );

  const existingIssues = existingIssueResult.rows[0];

  if (!existingIssues) throw new Error("Issues not found!");

  if (user.role === "contributor")
    throw new ApiError(409, "You can not delete any issues");

  const result = await pool.query(
    `
     DELETE FROM issues WHERE id=$1 RETURNING *
    `,
    [issueId],
  );

  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  UpdateIssueinDB,
  deleteIssueFromDB,
};
