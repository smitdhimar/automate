import type { JiraClient } from "../../clients/jira.client.js";

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string };
}

/**
 * Find the first transition whose destination status matches `targetStatus`
 * (case-insensitive).
 */
export const findTransition = (
  transitions: JiraTransition[],
  targetStatus: string,
): JiraTransition | undefined =>
  transitions.find(
    (t) => t.to.name.trim().toLowerCase() === targetStatus.trim().toLowerCase(),
  );

/**
 * Apply a transition to an issue.
 */
export const applyTransition = async (
  client: JiraClient,
  issueId: string,
  transitionId: string,
): Promise<void> => {
  await client.post(`/issue/${issueId}/transitions`, { transition: { id: transitionId } });
};

/**
 * Fetch the available transitions for an issue.
 */
export const fetchTransitions = async (
  client: JiraClient,
  issueId: string,
): Promise<JiraTransition[]> => {
  const data = await client.get<{ transitions: JiraTransition[] }>(`/issue/${issueId}/transitions`);
  return data.transitions;
};
