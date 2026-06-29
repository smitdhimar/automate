import { bold, reset } from "../global-configs.js";

// main menu choices
const mainMenuQestion = "What would you like to do?";
const mainChoices = [
  {
    name: `${bold}Git Operations${reset}`,
    value: "git",
    description: "Stage, commit, push, branch management & more",
  },
  {
    name: `${bold}Jira Operations${reset}`,
    value: "jira",
    description: "Issues, sprints, projects & board management",
  },
  {
    name: `${bold}Bitbucket Operations${reset}`,
    value: "bitbucket",
    description: "PRs, repos, pipelines & code reviews",
  },
  {
    name: `${bold}Run a Workflow${reset}`,
    value: "workflow",
    description: "Execute predefined workflows (feature, hotfix, etc.)",
  },
  {
    name: `${bold}Settings${reset}`,
    value: "settings",
    description: "Configure repositories, credentials & preferences",
  },
];

const exitChoice = {
  name: `${bold}Exit${reset}`,
  value: "exit",
  description: "Close the CLI",
};

export { exitChoice, mainChoices, mainMenuQestion };
