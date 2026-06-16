export enum IssueType {
  bug = "bug",
  feature_request = "feature_request",
}

export enum IssueStatus {
  open = "open",
  in_progress = "in_progress",
  resolved = "resolved",
}

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: IssueType;
  reporter_id: number;
  status?: IssueStatus;
}

export interface IIssue {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}
