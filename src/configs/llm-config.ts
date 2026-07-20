import { ConfigService } from "../services/cli.services/config.service.js";

export interface LLMConfig {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
}

export function readLLMConfig(): LLMConfig | null {
    const config = ConfigService.readConfig();
    if (!config?.LLM) return null;

    const llm = config.LLM as Record<string, string>;
    return {
        provider: llm.provider || "deepseek",
        apiKey: llm.apiKey || "",
        model: llm.model || "deepseek-chat",
        baseUrl: llm.baseUrl || "https://api.deepseek.com",
    };
}

export function isLLMConfigured(): boolean {
    const llmConfig = readLLMConfig();
    if (!llmConfig) return false;
    if (!llmConfig.apiKey || llmConfig.apiKey.includes("your-")) return false;
    return true;
}
