import { ToolRegistry } from "../../registry/tool.registry.js";
import { LLMClient } from "../../clients/llm.client.js";
import { convertToolsToLLMFormat } from "../../utils/llm-tool-converter.js";
import { logger } from "../../utils/logger.js";
import type { LLMMessage, LLMToolCall } from "../../types/llm/llm.types.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";

const MAX_ITERATIONS = 15;

const SYSTEM_PROMPT = `You are a developer automation assistant. You have access to Git, Jira, Bitbucket, and user-interaction tools.

## Rules
1. When the user says "checkout and push" or similar, use this sequence: 
   git_stash → git_fetch (for the target branch) → git_checkout → git_stashPop → user_stageFiles → git_commit → git_push
2. When creating a subtask: first list the parent issue if the user doesn't specify it, then create the subtask.
3. After creating a subtask, offer to create a branch for it (bitbucket_createBranch with the subtask key as issueNumber).
4. Always use tool call outputs as inputs for subsequent tool calls (e.g., use the subtask key from jira_createSubtask to create a branch).
5. If a tool fails, report the error clearly and suggest what to try next.
6. Before doing destructive operations (push, commit without message), ask the user to confirm.
7. For staging files, always use user_stageFiles — it gives the user the choice to stage all or stage manually. Do NOT use user_addAll directly for staging during a workflow.
8. Keep responses concise — the user is in a terminal.`;

export class AIOrchestrator {

    /**
     * Run the AI orchestration loop with the given user prompt.
     * @returns A summary string of what was accomplished.
     */
    static async run(prompt: string): Promise<string> {
        const llm = new LLMClient();

        // Build tool definitions for the LLM
        const allTools = ToolRegistry.getAllTools();
        const llmTools = convertToolsToLLMFormat(allTools);

        // Initialize conversation
        const messages: LLMMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ];

        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
            iteration++;

            logger.info(`Thinking... (step ${iteration}/${MAX_ITERATIONS})`);

            const response = await llm.chat(messages, llmTools);
            const choice = response.choices[0];
            const assistantMsg = choice.message;

            // Add assistant message to history
            messages.push({
                role: "assistant",
                content: assistantMsg.content,
                tool_calls: assistantMsg.tool_calls,
            });

            // If the assistant sent a text message, display it
            if (assistantMsg.content) {
                logger.plain(`\n${assistantMsg.content}`);
            }

            // If no tool calls and finish_reason is "stop", we're done
            if (!assistantMsg.tool_calls?.length && choice.finish_reason === "stop") {
                break;
            }

            // If no tool calls but finish_reason isn't "stop", something unexpected happened
            if (!assistantMsg.tool_calls?.length) {
                logger.warn(`LLM finished with reason: ${choice.finish_reason}`);
                break;
            }

            // Execute each tool call
            for (const toolCall of assistantMsg.tool_calls) {
                const result = await AIOrchestrator.executeToolCall(toolCall);

                // Append tool result to messages for the next LLM iteration
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                });
            }

            // If finish_reason is "stop" after tool calls, break
            if (choice.finish_reason === "stop") {
                break;
            }
            // Otherwise continue loop (finish_reason === "tool_calls")
        }

        if (iteration >= MAX_ITERATIONS) {
            logger.warn(`Reached max iterations (${MAX_ITERATIONS}). Stopping.`);
        }

        return "AI assistant finished.";
    }

    /**
     * Execute a single tool call from the LLM and return the result.
     */
    private static async executeToolCall(toolCall: LLMToolCall): Promise<ToolResult> {
        const toolName = toolCall.function.name;
        let args: Record<string, any> = {};

        try {
            args = JSON.parse(toolCall.function.arguments);
        } catch {
            return {
                success: false,
                error: `Invalid arguments JSON: ${toolCall.function.arguments}`,
            };
        }

        const tool = ToolRegistry.getTool(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool "${toolName}" not found. Available tools: ${ToolRegistry.getAllTools().map(t => t.id).join(", ")}`,
            };
        }

        logger.info(`🔧 Executing: ${toolName}`);

        try {
            const result = await ToolRegistry.execute(toolName, args);
            return result;
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
}
