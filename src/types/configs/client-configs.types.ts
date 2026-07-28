// ── Jira ─────────────────────────────────────────────────────────

export interface JiraCloudConfig {
  site: string;
  email: string;
  apiToken: string;
}

export interface JiraSelfHostedConfig {
  baseUrl: string;
  apiToken?: string;
  username?: string;
  password?: string;
}

export interface JiraConfig {
  hosting: "cloud" | "selfHosted";
  defaultProject: string;
  defaultFixVersion?: string;
  defaultSource?: string;
  assignee?: string;
  affectedFunctionalArea?: string;
  team?: string;
  cloud: JiraCloudConfig;
  selfHosted: JiraSelfHostedConfig;
}

// ── Bitbucket ────────────────────────────────────────────────────

export interface BitbucketCloudConfig {
  workspace: string;
  username: string;
  appPassword: string;
}

export interface BitbucketSelfHostedConfig {
  baseUrl: string;
  apiToken?: string;
  username?: string;
  password?: string;
  defaultProjectKey?: string;
  defaultRepoSlug?: string;
  reviewers?: string[];
}

export interface BitbucketConfig {
  hosting: "cloud" | "selfHosted";
  cloud: BitbucketCloudConfig;
  selfHosted: BitbucketSelfHostedConfig;
}

// ── Top-level shape stored in config.json ────────────────────────

export interface AppConfig {
  Jira: JiraConfig;
  Bitbucket: BitbucketConfig;
}
