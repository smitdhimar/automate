import { colors } from "../../configs/global-configs.js";
import { logger } from "../logger.js";

export const printSetupPromptUtil = (config_path: String): void => {
    const { bold, cyan, yellow, dim, reset } = colors;

    console.log("");
    logger.warn("First-time setup required!");
    console.log("");
    console.log(`  A configuration file has been created at:`);
    console.log(`  ${cyan}${config_path}${reset}`);
    console.log("");
    console.log(`  ${yellow}Please:${reset}`);
    console.log(`    1. Open the file:  ${cyan}code ${config_path}${reset}`);
    console.log(`    2. Fill in your ${bold}Jira${reset}, ${bold}Bitbucket${reset}, and ${bold}Git${reset} credentials`);
    console.log(`    3. Save the file`);
    console.log(`    4. Run ${cyan}automate${reset} again`);
    console.log("");
    console.log(`  ${dim}You can also use any text editor to edit the file.${reset}`);
    console.log(""); 

}