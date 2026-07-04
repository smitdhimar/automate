import { colors } from "../global-configs.js";

const { reset } = colors;

// main menu choices
const mainMenuQestion = "OPERATIONS";

const usageText = `
  Usage: automate

  An interactive CLI tool for Jira, Bitbucket, Git ops, and workflows.

  Run without arguments to launch the interactive menu.
    `;
const mainChoices = [
  {
    name: `Git Operations`,
    value: "git",
    description: "Stage, commit, push, branch management & more",
  },
  {
    name: `Jira Operations`,
    value: "jira",
    description: "Issues, sprints, projects & board management",
  },
  {
    name: `Bitbucket Operations`,
    value: "bitbucket",
    description: "PRs, repos, pipelines & code reviews",
  },
  {
    name: `Run a Workflow`,
    value: "workflow",
    description: "Execute predefined workflows (feature, hotfix, etc.)",
  },
  {
    name: `Settings`,
    value: "settings",
    description: "Configure repositories, credentials & preferences",
  },
];

const goBackToMenu = "Go back to Menu?";

const exitChoice = {
  name: `Exit`,
  value: "exit",
  description: "Close the CLI",
};

export { exitChoice, mainChoices, goBackToMenu, mainMenuQestion, usageText };
