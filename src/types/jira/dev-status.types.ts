// ── Jira Dev Status API types ───────────────────────────────────
// Endpoint: /rest/dev-status/latest/issue/detail?issueId=...&applicationType=stash&dataType=branch|pullrequest
// The endpoint returns the same shape for both dataTypes; the `branches`
// array populates for dataType=branch and `pullRequests` for dataType=pullrequest.

export interface DevStatusCommit {
  id: string;
  displayId: string;
  authorTimestamp?: string;
  message: string;
  url?: string;
}

export interface DevStatusBranch {
  name: string;
  url?: string;
  createPullRequestUrl?: string;
  repository?: Repository;
}

export interface Repository{
  name?: string, 
  avatar?: string, 
  avatarDescription?: string, 
  url?: string, 
}

export interface DevStatusReviewer {
  name: string;
  approved?: boolean;
}

export interface DevStatusPullRequest {
  id: string;
  name: string;
  url?: string;
  status: string;
  lastUpdate?: string;
  source?: { branch: string; url?: string };
  destination?: { branch: string; url?: string };
  reviewers?: DevStatusReviewer[];
}

export interface DevStatusRepository {
  name: string;
  url?: string;
  commits?: DevStatusCommit[];
  branches?: DevStatusBranch[];
  pullRequests?: DevStatusPullRequest[];
}

export interface DevStatusDetail {
  instance?: { name?: string; type?: string; baseUrl?: string };
  repositories?: DevStatusRepository[];
  branches?: any[],
  pullRequests?: any[]
}

export interface DevStatusResponse {
  detail?: DevStatusDetail[];
  errors?: unknown[];
}

/** Aggregated per-issue dev-status used for display. */
export interface IssueDevStatus {
  /** Jira browse URL for the issue key hyperlink. */
  url?: string;
  branches?: DevStatusBranch[];
  pullRequests?: DevStatusPullRequest[];
}
