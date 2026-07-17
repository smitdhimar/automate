import { colors, reset } from "../configs/global-configs.js";
import { logger } from "./logger.js";

// ── Small inline style helpers (avoids coupling to logger internals) ─
const style = {
  highlight: (t: string) => `${colors.cyan}${colors.bold}${t}${reset}`,
  dim:      (t: string) => `${colors.dim}${t}${reset}`,
};

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
  options?: { index?: number },
): void {
  const { key, fields } = issue;
  const prefix = options?.index != null ? `${options.index}. ` : "";

  // ── Extract field values ──────────────────────────────────
  const issueType = fields.issuetype?.name ?? "N/A";
  const status = fields.status?.name ?? "N/A";
  const statusCategory = fields.status?.statusCategory?.name ?? "";
  const fixVersions: string[] = (fields.fixVersions ?? []).map(
    (v: any) => v.name,
  );
  const rawDescription = extractDescription(fields.description);
  const hasDescription = rawDescription.length > 0;

  // ── Build the output ──────────────────────────────────────
  const lines: string[] = [];

  // Header
  lines.push(`${prefix}${style.highlight(key)}`);

  // Fields
  lines.push(`  ${style.dim("issuetype")}    → ${issueType}`);
  lines.push(
    `  ${style.dim("status")}       → ${status}${statusCategory ? ` (${statusCategory})` : ""}`,
  );
  lines.push(
    `  ${style.dim("fixVersions")}  → ${fixVersions.length > 0 ? fixVersions.join(", ") : style.dim("None")}`,
  );

  // Description – truncated to fit neatly
  if (hasDescription) {
    lines.push(`  ${style.dim("description")} → ${truncate(rawDescription, 120)}`);
  } else {
    lines.push(`  ${style.dim("description")} → ${style.dim("None")}`);
  }

  // ── Print ─────────────────────────────────────────────────
  logger.plain(lines.join("\n"));
}

/**
 * Batch version – logs an array of issues, each prefixed with an index.
 */
export function logIssueList(
  issues: { key: string; fields: Record<string, any> }[],
): void {
  if (issues.length === 0) {
    logger.info("No issues to display.");
    return;
  }

  issues.forEach((issue, i) => {
    logIssueFields(issue, { index: i + 1 });

    if (i < issues.length - 1) {
      logger.plain("");
    }
  });
}


