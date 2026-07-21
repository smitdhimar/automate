export const DEFAULT_CONFIG = {
  "Jira": {
    "hosting": "cloud",
    "defaultProject":"your-default-project",
    "cloud": {
      "site": "your-domain",
      "email": "your-email@example.com",
      "apiToken": "your-jira-api-token"
    },
    "selfHosted": {
      "baseUrl": "https://jira.your-company.com",
      "username": "your-username",
      "password": "your-password"
    }
  },
  "Bitbucket": {
    "hosting": "cloud",
    "cloud": {
      "workspace": "your-workspace",
      "username": "your-username",
      "appPassword": "your-bitbucket-app-password"
    },
    "selfHosted": {
      "baseUrl": "https://bitbucket.your-company.com",
      "username": "your-username",
      "password": "your-password"
    }
  },
  "LLM": {
    "provider": "deepseek",
    "apiKey": "your-llm-api-key",
    "model": "deepseek-chat",
    "baseUrl": "https://api.deepseek.com"
  }
};
