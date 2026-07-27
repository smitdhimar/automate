import { enableCloudSupport } from "../global-configs.js";

export const DEFAULT_CONFIG = {
  Git: {
    commitPrefixEnabled: false,
    defaultDevStream:
      "your default branch to take pull from / create branch from",
    gitTrackingFileExts: [
      "js",
      "properties",
      "java",
      "ts",
      "jsx",
      "tsx",
      "html",
      "jsp",
      "py",
    ],
  },
  Jira: {
    hosting: "selfHosted",
    defaultProject: "your-default-project",
    ...(enableCloudSupport && {
      cloud: {
        site: "your-domain",
        email: "your-email@example.com",
        apiToken: "your-jira-api-token",
      },
    }),
    selfHosted: {
      baseUrl: "https://jira.your-company.com",
      apiToken: "your-jira-api-token",
    },
  },
  Bitbucket: {
    hosting: "selfHosted",
    ...(enableCloudSupport && {
      cloud: {
        workspace: "your-workspace",
        username: "your-username",
        appPassword: "your-bitbucket-app-password",
      },
    }),
    selfHosted: {
      baseUrl: "https://bitbucket.your-company.com",
      apiToken: "your-bitbucket-api-token",
      defaultProjectKey: "your-project-key",
      defaultRepoSlug: "your-repo-slug",
      reviewers: [
        {
          user: {
            name: "reviewer1Username",
          },
        },
      ],
    },
  },
  LLM: {
    provider: "deepseek",
    apiKey: "your-llm-api-key",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
  },
};
