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

export const generateResponsiveBanner = ( text: string ): string => {
  const width = Math.min(process.stdout.columns || 80, 120);
  const innerWidth = width - 4;

  const top = `╔${"═".repeat(innerWidth)}╗`;
  const middle = (text: string) => {
    const padded = ` ${text} `;
    const leftPad = Math.floor((innerWidth - padded.length) / 2);
    const rightPad = innerWidth - padded.length - leftPad;
    return `║${" ".repeat(leftPad)}${padded}${" ".repeat(rightPad)}║`;
  };
  const bottom = `╚${"═".repeat(innerWidth)}╝`;
  const empty = `║${" ".repeat(innerWidth)}║`;

  return `\n${top}\n${empty}\n${middle(`${text}`)}\n${empty}\n${bottom}\n`;
};
export default prompt;