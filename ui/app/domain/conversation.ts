export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    model?: string;
}

export interface ConversationDetails {
    summary?: string;
    tags?: string[];
    customContext?: Record<string, unknown>;
}

export interface ConversationDocument {
    conversationId: string;
    copilotConversationId?: string;
    title?: string;
    modelId: string;
    messages: ConversationMessage[];
    details?: ConversationDetails;
    createdAt: string;
    updatedAt: string;
}

export interface Model {
    id: string;
    name: string;
    description?: string;
}