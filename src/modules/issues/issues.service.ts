import { pool } from "../../db";
import {
  IssueStatus,
  IssueType,
  type ICreateIssuePayload,
  type IIssue,
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

const getAllIssuesFromDB = async (
  query: TGetIssueQuery,
): Promise<TIssueWithReporter[]> => {
  const { sort = "newest", type, status } = query;

  const conditions: string[] = [];
  const values: string[] = [];

  if (sort !== "newest" && sort !== "oldest")
    throw new Error("Sort must be either newest or oldest");

  if (type) {
    if (!Object.values(IssueType).includes(type as IssueType)) {
      throw new Error("Type must be either bug or feature request");
    }

    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (status) {
    if (!Object.values(IssueStatus).includes(status as IssueStatus)) {
      throw new Error("Status must be open, in progress, or resolved");
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

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
