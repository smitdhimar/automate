import { simpleGit } from "simple-git";
import { logger } from "../../utils/logger.js";

const git = simpleGit();

export class GitService {

    // gets the status of repo
    static async status(_args?: Record<string, any>) {

        const status = await git.raw(["status"]);
        logger.plain(status);
    }

    // checks out to specified branch
    static async checkout(args: { branch: string }) {

        await git.checkout(args.branch);
        logger.success(`Switched to branch: ${args.branch}`);
    }

    // pull from specific origin branch
    static async pullFrom(args: { branch: string }){
        const response = await git.pull('origin', args.branch);
        logger.plain(response);
    }

    // take stash
    static async stash() {
        const stash = await git.stash();
        logger.plain(stash);
    }

    // pop stash
    static async stashPop() {
        const stashPop = await git.stash(['pop']);
        logger.plain(stashPop);
    }

    // git fetch origin branch-name
    static async fetchFrom(args: {branch: string}) {
        const response = await git.fetch('origin', args.branch);
        logger.plain(response);
    }

    // git push
    static async push() {
        // check if the current branch has any el number + git service has active credentials 
        // if above both is true check status 
        // else push 

        // check if subtask status is in progress via jira service
        // const status = await JiraService.getStatus();        
        // if (status === "In Progress"){
        //     const response = await git.push();
        //     logger.plain(response);
        // }
        // else{   
        //     logger.error("Subtask is not In Progress");
        //     return;
        // }
    }

    static async getBranchName() {
        const branch =  await git.branch(['--show-current']);
        return branch?.current;
    }

    // git commit to specific issue number with message
    // issue number will be fetched from current branch name
    static async commit(args: {message: string}){
        
        const branchName = await GitService.getBranchName();
        
        const response = await git.commit(`${branchName} ${args.message}`);
        logger.plain(response)
    }
}

