// ── Jira ─────────────────────────────────────────────────────────

export interface JiraCloudConfig {
  site: string;
  email: string;
  apiToken: string;
}

export interface JiraSelfHostedConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface JiraConfig {
  hosting: "cloud" | "self-hosted";
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
  username: string;
  password: string;
}

export interface BitbucketConfig {
  hosting: "cloud" | "self-hosted";
  cloud: BitbucketCloudConfig;
  selfHosted: BitbucketSelfHostedConfig;
}

// ── Top-level shape stored in config.json ────────────────────────

export interface AppConfig {
  Jira: JiraConfig;
  Bitbucket: BitbucketConfig;
}
