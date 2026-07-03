import { themeType } from "../types/configs/global-configs.types.js";

const reset = "\x1b[0m";
const dim = "\x1b[2m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const white = "\x1b[37m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";

const pageSize = 8;

const Theme: themeType = {
  prefix: {
    idle: `${cyan}?${reset} `,
    done: `${green}✔${reset} `,
  },
  spinner: {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  },
  icon: {
    cursor: `${cyan}❯${reset} `,
  },
  style: {
    answer: (text) => `${cyan}${text}${reset}`,
    message: (text, status) => {
      const colors: Record<string, string> = {
        idle: `${bold}${white}`,
        done: `${green}`,
        loading: cyan,
      };
      return `${colors[status] || ""}${text}${reset}`;
    },
    error: (text) => `${red}${text}${reset}`,
    defaultAnswer: (text) => `${dim}(${text})${reset}`,
    help: (text) => `${dim}${text}${reset}`,
    highlight: (text) => `${cyan}${bold}${text}${reset}`,
    key: (text) => `${bold}${cyan}${text}${reset}`,
    disabled: (text) => `${dim}${text}${reset}`,
    description: (text) => `${text}${reset}`,
    keysHelpTip: (keys) => {
      const parts = keys.map(
        ([key, action]) =>
          `${bold}${cyan}${key}${reset} ${dim}${action}${reset}`,
      );
      return parts.join("  ");
    },
  },
  helpMode: "always",
  indexMode: "hidden",
  validationFailureMode: "keep",
};

const navigation = {
  navigation: `${dim}↑/↓ Navigate${reset}  ${cyan}⏎${reset} ${dim}Select${reset}`,
  pager: `${dim}(See more)${reset}`,
};

const colors = {
  reset,dim , bold, cyan, green, yellow, red, white, blue , magenta
}
export { Theme, reset, navigation, pageSize, colors };
