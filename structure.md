developer-toolkit/
│
├── package.json
├── tsconfig.json
├── .env
│
├── configs/
│ ├── global.json
│ └── repositories/
│ ├── payments.json
│ └── mobile.json
│
├── workflows/
│ ├── feature.json
│ └── hotfix.json
│
├── src/
│
│ ├── index.ts
│
│ ├── commands/
│ │ ├── git.ts
│ │ ├── jira.ts
│ │ ├── workflow.ts
│ │ └── index.ts
│
│ ├── services/
│ │ ├── git.service.ts
│ │ ├── jira.service.ts
│ │ ├── bitbucket.service.ts
│ │ ├── workflow.service.ts
│ │ ├── terminal.service.ts
│ │ └── config.service.ts
│
│ ├── clients/
│ │ ├── jira.client.ts
│ │ ├── bitbucket.client.ts
│ │ └── http.client.ts
│
│ ├── registry/
│ │ └── action.registry.ts
│
│ ├── utils/
│ │ ├── logger.ts
│ │ ├── prompts.ts
│ │ ├── validation.ts
│ │ └── constants.ts
│
│ └── types/
│ └── index.ts
│
└── tests/
