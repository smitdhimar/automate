import type { LLMMessage, LLMToolDefinition, LLMResponse } from "../types/llm/llm.types.js";
import { readLLMConfig, isLLMConfigured } from "../configs/llm-config.js";

export class LLMClient {

    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor() {
        const config = readLLMConfig();
        if (!config || !isLLMConfigured()) {
            throw new Error(
                "LLM is not configured. Add your LLM API key in ~/.automate/config.json under the \"LLM\" section."
            );
        }
        this.apiKey = config.apiKey;
        this.model = config.model;
        this.baseUrl = config.baseUrl;
    }

    /**
     * Send a chat completion request with optional tool definitions.
     * Returns the full API response.
     */
    async chat(
        messages: LLMMessage[],
        tools?: LLMToolDefinition[],
    ): Promise<LLMResponse> {
        const url = `${this.baseUrl}/v1/chat/completions`;

        const body: Record<string, unknown> = {
            model: this.model,
            messages,
            ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `LLM API error (${response.status}): ${errorText.slice(0, 500)}`
            );
        }

        const data = (await response.json()) as LLMResponse;

        if (!data.choices?.length) {
            throw new Error("LLM returned no choices in response");
        }

        return data;
    }
}
