import { colors } from "../configs/global-configs.js";

const timeStamp = () => {
    return new Date().toLocaleTimeString();
};

const log = (color: string, label: string, message: string, ...args: unknown[]) => {
    const extra = args.length ? ` ${args.map(a => JSON.stringify(a)).join(" ")}` : "";
    console.log(
        `${color}[${timeStamp()}] [ ${label} ] ${message}${extra}${colors.reset}`
    );
};

export const logger = {
    info: (message: string, ...args: unknown[]) => log(colors.cyan, "INFO", message, ...args),
    success: (message: string, ...args: unknown[]) => log(colors.green, "OK", message, ...args),
    warn: (message: string, ...args: unknown[]) => log(colors.yellow, "WARN", message, ...args),
    error: (message: string, ...args: unknown[]) => log(colors.red, "ERROR", message, ...args),
    debug: (message: string, ...args: unknown[]) => log(colors.magenta, "DEBUG", message, ...args),
    dim: (message: string, ...args: unknown[]) => log(colors.dim, "─", message, ...args),
    bold: (message: string, ...args: unknown[]) => log(colors.bold, "◆", message, ...args),
    raw: (message: string, ...args: unknown[]) => log(colors.white, "LOG", message, ...args),
    plain: (message: Object, ...args: unknown[]) => console.log("\r \r",message, ...args),
};

