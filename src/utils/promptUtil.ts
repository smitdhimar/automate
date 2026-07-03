import inquirer from "inquirer";
import type { Question } from "inquirer";
import { navigation, pageSize as defaultPageSize, Theme } from "./../configs/global-configs.js";

type PromptConfig = Question & {
  pageSize?: number;
};

const prompt = async (config: PromptConfig | PromptConfig[]): Promise<any> => {
  const questions = Array.isArray(config) ? config : [config];

  const enrichedQuestions = questions.map((q) => ({
    ...q,
    theme: Theme,
    pageSize: q.pageSize ?? defaultPageSize,
    instructions: navigation,
  }));

  const answers = await inquirer.prompt(enrichedQuestions);
  return answers[questions[0]?.name ?? "action"];
};

export default prompt;