// OpenAI-compatible LLM types (works with DeepSeek)

export interface LLMMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: LLMToolCall[];
    tool_call_id?: string;
    name?: string;
}

export interface LLMToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface LLMToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, LLMParameterSchema>;
            required: string[];
        };
    };
}

export interface LLMParameterSchema {
    type: "string" | "number" | "boolean";
    description: string;
}

export interface LLMChoice {
    index: number;
    message: {
        role: "assistant";
        content: string | null;
        tool_calls?: LLMToolCall[];
    };
    finish_reason: "stop" | "tool_calls" | "length" | "content_filter";
}

export interface LLMResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: LLMChoice[];
}
