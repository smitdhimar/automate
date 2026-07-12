import { themeType } from "../types/configs/global-configs.types.js";

// ── ANSI escape codes ──────────────────────────────────────────
const reset = "\x1b[0m";
const dim = "\x1b[2m";
const bold = "\x1b[1m";

// Foreground colors
const blue = "\x1b[34m";
const brightBlue = "\x1b[94m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const white = "\x1b[37m";
const magenta = "\x1b[35m";

// Background colors
// const bgBlue = "\x1b[44m";


const Theme: themeType = {
  prefix: {
    idle: `${bold}${brightBlue}?${reset} `,
    done: `${bold}${green}✔${reset} `,
  },
  spinner: {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  },
  icon: {
    cursor: `❯`,
  },
  style: {
    answer: (text) => `${cyan}${text}${reset}`,
    message: (text, status) => {
      const colors: Record<string, string> = {
        idle: `${bold}`,
        done: `${bold}${green}`,
        loading: brightBlue,
      };
      return `${colors[status] || ""}${text}${reset}`;
    },
    error: (text) => `${bold}${red}${text}${reset}`,
    defaultAnswer: (text) => `${dim}${text}${reset}`,
    help: (text) => `${dim}${text}${reset}`,
    highlight: (text) => `${cyan}${bold}${text}${reset}`,
    key: (text) => `${bold}${brightBlue}${text}${reset}`,
    disabled: (text) => `${dim}${text}${reset}`,
    description: (text) => `~ ${white}${text}${reset}`,
    keysHelpTip: (keys) => {
      const parts = keys.map(
        ([key, action]) =>
          `${bold}${brightBlue}${key}${reset} ${dim}${action}${reset}`,
      );
      return parts.join("  ");
    },
  },
  helpMode: "always",
  indexMode: "hidden",
  validationFailureMode: "keep",
};

const navigation = {
  navigation: `${dim}↑/↓${reset} ${dim}Navigate${reset}  ${bold}${brightBlue}⏎${reset} ${dim}Select${reset}`,
  pager: `${dim}(See more)${reset}`,
};

const colors = {
  reset, dim, bold,
  blue, brightBlue, cyan, green, yellow, red, white, magenta,
};

export { Theme, reset, navigation, colors };