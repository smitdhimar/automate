import { logger } from "../utils/logger.js";

export class BitbucketService {

    static async createBranch(args: { issueNumber: String }) {
       logger.plain(`ℹ️  Creating branch`);
    }
    
}
