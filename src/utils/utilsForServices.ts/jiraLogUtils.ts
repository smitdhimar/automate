import { colors, reset } from "../../configs/global-configs.js";
import { logger } from "../logger.js";
import type {
  DevStatusBranch,
  DevStatusPullRequest,
  IssueDevStatus,
} from "../../types/jira/dev-status.types.js";

// ── Small inline style helpers (avoids coupling to logger internals) ─
const style = {
  highlight: (t: string) => `${colors.cyan}${colors.bold}${t}${reset}`,
  dim:      (t: string) => `${colors.dim}${t}${reset}`,
};

// ── OSC 8 terminal hyperlink ──────────────────────────────────
function hyperlink(text: string, url?: string): string {
  if (!url) return text;
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

// ── Extract plain text from Atlassian Document Format ──────────
function extractTextFromADF(node: Record<string, any>): string {
  if (!node || typeof node !== "object") return "";

  if (node.type === "text" && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromADF).join("");
  }

  return "";
}

// ── Extract a readable description from ADF / null / string ───
function extractDescription(description: any): string {
  if (!description) return "";
  if (typeof description === "string") return description;
  // Assume Atlassian Document Format (ADF)
  return extractTextFromADF(description).trim();
}

// ── Truncate long text with a visual hint ─────────────────────
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

// ── Dev-status rendering (branches & pull requests) ──────────
// function renderBranches(branches?: DevStatusBranch[]): string[] {
//   if (!branches?.length) return [];
//   const lines: string[] = [`  ${style.dim("branches")}     →`];
//   for (const b of branches) {
//     const commit = b.lastCommit
//       ? `${style.dim(b.lastCommit.displayId)} ${b.lastCommit.message}`
//       : "";
//     lines.push(
//       `    • ${hyperlink(b.name, b.url)}` +
//         (b.createBy ? ` ${style.dim(`(${b.createBy})`)}` : "") +
//         (commit ? ` ${style.dim(`— ${commit}`)}` : ""),
//     );
//   }
//   return lines;
// }

function renderPullRequests(prs?: DevStatusPullRequest[]): string[] {
  if (!prs?.length) return [];
  const lines: string[] = [`  ${style.dim("pullRequests")} →`];
  for (const pr of prs) {
    const dest = pr.destination?.branch
      ? ` ${style.dim(`→ ${pr.destination.branch}`)}`
      : "";
    const reviewers = pr.reviewers?.length
      ? ` ${style.dim(`[${pr.reviewers.map((r) => `${r.name}${r.approved ? " ✓" : ""}`).join(", ")}]`)}`
      : "";
    lines.push(
      `    • ${hyperlink(`${pr.id} ${pr.name}`, pr.url)} ${style.dim(`[${pr.status}]`)}${dest}${reviewers}`,
    );
  }
  return lines;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Logs the key fields of a Jira issue in a clean, readable format.
 *
 * Fields displayed: issue key, issue type, status, fix versions, description.
 *
 * @param issue       - The raw issue object from the Jira API.
 * @param options     - Optional settings.
 * @param options.index - If provided, prepends an index (e.g. "1.") to the issue line.
 */
export function logIssueFields(
  issue: { key: string; fields: Record<string, any> },
  options?: {
    index?: number;
    url?: string;
    branches?: DevStatusBranch[];
    pullRequests?: DevStatusPullRequest[];
  },
): void {
  const { key, fields } = issue;
  const prefix = options?.index != null ? `${options.index}. ` : "";

  // ── Extract field values ──────────────────────────────────
  const status = fields.status?.name ?? "N/A";
  const statusCategory = fields.status?.statusCategory?.name ?? "";
  const fixVersions: string[] = (fields.fixVersions ?? []).map(
    (v: any) => v.name,
  );

  // ── Build the output ──────────────────────────────────────
  const lines: string[] = [];

  // Header — issue key is a clickable link to the Jira issue when a URL is provided
  lines.push(`${prefix}${hyperlink(style.highlight(key), options?.url)}: ${fields.summary ?? ""}`);

  // Fields
  lines.push(
    `  ${style.dim("status")}       → ${status}${statusCategory ? ` (${statusCategory})` : ""}`,
  );
  lines.push(
    `  ${style.dim("fixVersions")}  → ${fixVersions.length > 0 ? fixVersions.join(", ") : style.dim("None")}`,
  );

  // Dev-status — branches & pull requests linked to the subtask
  // lines.push(...renderBranches(options?.branches));
  lines.push(...renderPullRequests(options?.pullRequests));

  // ── Print ─────────────────────────────────────────────────
  logger.plain(lines.join("\n"));
}

/**
 * Batch version – logs an array of issues, each prefixed with an index.
 */
export function logIssueList(
  issues: { key: string; fields: Record<string, any> }[],
  devStatus?: IssueDevStatus[],
): void {
  if (issues.length === 0) {
    logger.info("No issues to display.");
    return;
  }

  issues.forEach((issue, i) => {
    logIssueFields(issue, { index: i + 1, ...(devStatus?.[i] ?? {}) });

    if (i < issues.length - 1) {
      logger.plain("");
    }
  });
}