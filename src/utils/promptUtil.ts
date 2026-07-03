import { Theme } from "../configs/global-configs.js";
import inquirer from "inquirer";

const prompt = async ( message: any , choices: any[] , pageSize: number = 8) : Promise<String> => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message,
      pageSize,
      choices:  choices,
      instructions: navigation,
      theme: Theme,
    },
  ]);

  return action;
}

export default prompt;