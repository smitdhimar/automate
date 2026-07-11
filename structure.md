automate/
│
├── package.json
├── tsconfig.json
├── structure.md
├── README.md
│
├── workflows/
│   ├── feature.json
│   └── hotfix.json
│
├── src/
│   ├── index.ts                          # Entry point
│   │
│   ├── clients/
│   │   ├── base.client.ts                # IProductClient interface
│   │   ├── http.client.ts                # Shared fetch wrapper (HttpClient)
│   │   ├── jira.client.ts                # Jira — cloud & self-hosted
│   │   └── bitbucket.client.ts           # Bitbucket — cloud & self-hosted
│   │
│   ├── configs/
│   │   ├── global-configs.ts             # Theme, ANSI colors, nav helpers
│   │   ├── client-configs/
│   │   │   └── config-template.ts        # Default config shape for ~/.automate/config.json
│   │   ├── tools-configs/
│   │   │   └── tools-configs.ts          # Tool definitions (git, jira, bitbucket)
│   │   └── ui-configs/
│   │       └── ui-configs.ts
│   │
│   ├── services/
│   │   ├── config.service.ts             # Config file read/write/init
│   │   ├── git.service.ts                # Git operations
│   │   ├── jira.service.ts               # Jira business logic (uses JiraClient)
│   │   ├── bitbucket.service.ts          # Bitbucket business logic (uses BitbucketClient)
│   │   ├── menu.service.ts               # Interactive menu
│   │   ├── prompt.service.ts             # User prompts
│   │   └── workflow.service.ts           # Workflow execution
│   │
│   ├── registry/
│   │   └── tool.registry.ts              # ToolRegistry
│   │
│   ├── types/
│   │   ├── configs/
│   │   │   ├── global-configs.types.ts   # themeType
│   │   │   ├── client-configs.types.ts   # JiraConfig, BitbucketConfig, AppConfig
│   │   │   └── ui-configs.types/
│   │   │       └── tool-configs.types.ts # ToolDefinition, ToolArgument
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── promptUtil.ts
│   │   ├── spinner.ts
│   │   └── utilsForServices.ts/
│   │       └── gitServiceUtils.ts
│   │
│   └── workflows/
