# 🚀 Automate CLI

> A powerful CLI tool for handling **Git operations**, **Jira**, **Bitbucket**, and **day-to-day developer workflows** — all from an interactive menu.

[![npm version](https://img.shields.io/npm/v/automate-cli.svg)](https://www.npmjs.com/package/automate-cli)
[![License](https://img.shields.io/npm/l/automate-cli.svg)](https://github.com/smitdhimar61/automate/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/automate-cli.svg)](https://www.npmjs.com/package/automate-cli)

---

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Available Git Commands](#-available-git-commands)
- [Publishing & Test](#-publishing--test)

---

## 📁 Project Structure

```
automate/
│
├── package.json                  # Project manifest & dependencies
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # This file
│
├── src/
│   ├── index.ts                  # Entry point — initializes config & starts menu
│   │
│   ├── clients/
│   │   ├── bitbucket.client.ts   # Bitbucket API client
│   │   └── jira.client.ts        # Jira API client
│   │
│   ├── configs/
│   │   ├── global-configs.ts     # Global constants & theme settings
│   │   ├── client-configs/
│   │   │   └── config-template.ts # Default config template (creds placeholders)
│   │   ├── tools-configs/
│   │   │   └── tools-configs.ts  # Tool definitions (Git, Jira tools)
│   │   └── ui-configs/
│   │       └── ui-configs.ts     # UI-related configurations
│   │
│   ├── registry/
│   │   └── tool.registry.ts      # Tool registry — registers & dispatches tools
│   │
│   ├── services/
│   │   ├── git.service.ts        # Git operations (status, commit, push, etc.)
│   │   ├── jira.service.ts       # Jira operations (list/create issues)
│   │   ├── bitbucket.service.ts  # Bitbucket operations (create branch)
│   │   ├── config.service.ts     # Config file management (~/.automate/config.json)
│   │   ├── menu.service.ts       # Interactive menu loop (category → tool → execute)
│   │   ├── prompt.service.ts     # Inquirer-based prompt helpers
│   │   └── workflow.service.ts   # Workflow execution from JSON files
│   │
│   ├── types/
│   │   └── configs/
│   │       ├── global-configs.types.ts
│   │       └── ui-configs.types/
│   │           └── tool-configs.types.ts  # ToolDefinition type
│   │
│   └── utils/
│       ├── logger.ts             # Colored console logger
│       ├── promptUtil.ts         # Inquirer prompt wrapper & banner generator
│       ├── spinner.ts            # Loading spinner utility
│       └── utilsForServices.ts/
│           └── gitServiceUtils.ts # Git helper utilities
│
└── workflows/                    # Workflow JSON files (feature, hotfix, etc.)
    ├── feature.json
    └── hotfix.json
```

---

## ✨ Features

| Category  | Available Actions |
|-----------|------------------|
| **🔄 Git** | Check status, checkout branches, stash/unstash, commit, push, pull, fetch |
| **📋 Jira** | List issues, create issues |
| **🪣 Bitbucket** | Create branches from issues |
| **⚡ Workflows** | Run predefined multi-step workflows (feature, hotfix) |

---

## ✅ Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later
- A **Git** repository (for Git operations)
- *(Optional)* Jira & Bitbucket credentials for cloud integrations

---

## 📦 Installation

### 1️⃣ Global Install (Recommended)

Install the package globally via npm:

```bash
npm install -g automate-cli@latest
```

### 2️⃣ Verify Installation

Check that the CLI is installed correctly:

```bash
automate --version
# or
which automate
```

### 3️⃣ First Run (Auto-Generates Config)

Run the tool to generate the config file:

```bash
automate
```

On the **first run**, the CLI will automatically create a configuration file at:

```
~/.automate/config.json
```

It will then print instructions and exit so you can set up your credentials.

---

## 🔧 Configuration

### Config File Location

```
~/.automate/config.json
```

### Default Template

When the config file is first created, it looks like this:

```json
{
  "_instructions": "Edit this file with your actual credentials and settings.",
  "jira": {
    "baseUrl": "https://your-domain.atlassian.net",
    "email": "your-email@example.com",
    "apiToken": "your-jira-api-token",
    "projectKey": "PROJ"
  },
  "bitbucket": {
    "workspace": "your-workspace",
    "username": "your-username",
    "appPassword": "your-bitbucket-app-password"
  },
  "_note": "Replace all 'your-*' values with your real configuration."
}
```

### Setup Steps

1. **Open the config file** in your editor:
   ```bash
   code ~/.automate/config.json
   ```
   *(or use `vim`, `nano`, or any text editor)*

2. **Replace the placeholder values** with your actual credentials:
   - **Jira**: Your Atlassian domain, email, [API token](https://id.atlassian.com/manage/api-tokens), and project key
   - **Bitbucket**: Your workspace name, username, and [app password](https://bitbucket.org/account/settings/app-passwords/)

3. **Save the file** and re-run `automate`.

> ⚠️ **Important:** The CLI checks whether you've replaced the placeholder values. If any field still contains `your-*`, it will warn you that the service isn't configured.

---

## 🎮 Usage

```bash
automate
```

Once running, follow the interactive prompts:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                 🚀 Automate                      │
│                                                  │
└──────────────────────────────────────────────────┘

? Select a category: (Use arrow keys)
❯ Git
  Jira
  Exit

? Select a tool:
  ❯ Status          — Show repository status
    Checkout Branch — Checkout a branch
    Commit          — Commit with issue number & message
    Push            — Push to current branch
    Pull            — Pull from specified branch
    Fetch           — Fetch from specified branch
    Stash           — Take a stash
    Stash Pop       — Stash pop
    ← Go back
```

### Navigation Tips

- Use **arrow keys** ↑↓ to navigate
- Press **Enter** to select
- Choose **← Go back** to return to the previous menu
- Choose **Exit** to quit

---

## 🔄 Available Git Commands

Each Git operation in the menu maps to a real `git` command under the hood:

| Menu Option      | Equivalent Git Command                     | Description                              |
|------------------|--------------------------------------------|------------------------------------------|
| **Status**       | `git status`                               | Show the working tree status             |
| **Checkout**     | `git checkout <branch>`                    | Switch to an existing branch             |
| **Stash**        | `git stash`                                | Stash the changes in a dirty working directory |
| **Stash Pop**    | `git stash pop`                            | Restore stashed changes back to working tree |
| **Push**         | `git push`                                 | Push commits to the current remote branch |
| **Pull**         | `git pull origin <branch>`                 | Fetch from and integrate with a remote branch |
| **Fetch**        | `git fetch origin <branch>`                | Download objects and refs from a remote  |
| **Commit**       | `git commit -m "<branch-name> <message>"` | Commit staged changes with branch name prefixed |

> 💡 **Commit note:** When using the Commit tool, the current branch name is automatically prefixed to your commit message (e.g., `git commit -m "feature/TICKET-123 Add login page"`).

> 💡 **Push note:** The Push tool checks the Jira status of the associated issue before pushing. If the subtask is not **"In Progress"**, the push is blocked.

---

## 🧪 Publishing & Test

### Publishing to npm

Steps to publish a new version of `automate-cli`:

```bash
# 1. Login to npm (one-time setup)
npm login

# 2. Verify you're logged in (optional)
npm whoami

# 3. Choose a version bump
npm version patch   # Bug fixes (1.0.0 → 1.0.1)
npm version minor   # New features, backward-compatible (1.0.0 → 1.1.0)
npm version major   # Breaking changes (1.0.0 → 2.0.0)

# 4. Publish to npm registry
npm publish
```

> 🔄 The `prepublishOnly` script in `package.json` automatically runs `npm run build` (TypeScript compilation) before each publish.

### Local Testing with npm link

Before publishing, test your changes locally:

```bash
# 1. Build the project
npm run build

# 2. Create a global symlink
npm link automate

# 3. Test the CLI
automate

# 4. Remove the symlink when done
npm unlink automate
```

### Development Commands

| Command               | Description                            |
|-----------------------|----------------------------------------|
| `npm run build`       | Compile TypeScript → JavaScript (`tsc`) |
| `npm run dev`         | Watch mode — auto-compile on changes   |
| `npm run start`       | Run the TypeScript source directly     |
| `npm run buildStart`  | Run the compiled JavaScript output     |

---

## 🛠️ Built With

- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) — Interactive prompts
- [simple-git](https://github.com/steveukx/git-js) — Git operations
- [Axios](https://axios-http.com/) — HTTP client

---

<div align="center">
  Made by <a href="https://github.com/smitdhimar61">smitdhimar61</a>
</div>