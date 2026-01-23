import { useState, useCallback, useRef } from "react";
import { useDirectLineToken } from "./useDirectLineToken";
import { useDirectLineConversation } from "./useDirectLineConversation";
import {
    useConversationDocuments,
    ConversationDocument,
    ConversationMessage,
} from "./useConversationDocuments";

export interface ChatSessionState {
    isActive: boolean;
    documentId: string | null;
    conversationId: string | null;
    messages: ConversationMessage[];
}

export const useChatSession = () => {
    const [sessionState, setSessionState] = useState<ChatSessionState>({
        isActive: false,
        documentId: null,
        conversationId: null,
        messages: [],
    });

    const documentVersionRef = useRef<string>("0");
    const documentNameRef = useRef<string>("");
    const conversationContentRef = useRef<ConversationDocument | null>(null);

    const { token, fetchToken } = useDirectLineToken();
    const { createConversation, connectWebSocket, disconnectWebSocket } = useDirectLineConversation();
    const {
        createConversationDocument,
        addMessageToConversation,
        getConversationHistory,
        refetchList,
    } = useConversationDocuments();

    const handleWebSocketMessage = useCallback((data: unknown) => {
        const messageData = data as { activities?: Array<{ from?: { role?: string }; text?: string }> };
        if (messageData.activities) {
            messageData.activities.forEach((activity) => {
                if (activity.from?.role === "bot" && activity.text) {
                    const botMessage: ConversationMessage = {
                        role: "model",
                        text: activity.text,
                        timestamp: new Date().toISOString(),
                    };

                    setSessionState((prev) => ({
                        ...prev,
                        messages: [...prev.messages, botMessage],
                    }));

                    if (sessionState.documentId && conversationContentRef.current) {
                        addMessageToConversation(
                            sessionState.documentId,
                            documentVersionRef.current,
                            documentNameRef.current,
                            conversationContentRef.current,
                            "model",
                            activity.text
                        );
                        documentVersionRef.current = String(Number(documentVersionRef.current) + 1);
                    }
                }
            });
        }
    }, [sessionState.documentId, addMessageToConversation]);

    const startNewSession = useCallback(async (): Promise<boolean> => {
        try {
            const directLineToken = await fetchToken();
            if (!directLineToken) return false;

            const conversation = await createConversation(directLineToken);
            if (!conversation) return false;

            const documentId = await createConversationDocument(conversation.conversationId);
            if (!documentId) return false;

            connectWebSocket(conversation.streamUrl, handleWebSocketMessage);

            conversationContentRef.current = {
                conversationId: conversation.conversationId,
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            documentVersionRef.current = "0";
            documentNameRef.current = `Conversation ${conversation.conversationId}`;

            setSessionState({
                isActive: true,
                documentId,
                conversationId: conversation.conversationId,
                messages: [],
            });

            return true;
        } catch (error) {
            console.error("Failed to start new session:", error);
            return false;
        }
    }, [fetchToken, createConversation, createConversationDocument, connectWebSocket, handleWebSocketMessage]);

    const resumeSession = useCallback(
        async (documentId: string, documentContent: ConversationDocument, version: string, name: string): Promise<boolean> => {
            try {
                const directLineToken = await fetchToken();
                if (!directLineToken) return false;

                const conversation = await createConversation(directLineToken);
                if (!conversation) return false;

                connectWebSocket(conversation.streamUrl, handleWebSocketMessage);

                conversationContentRef.current = documentContent;
                documentVersionRef.current = version;
                documentNameRef.current = name;

                setSessionState({
                    isActive: true,
                    documentId,
                    conversationId: conversation.conversationId,
                    messages: documentContent.messages,
                });

                return true;
            } catch (error) {
                console.error("Failed to resume session:", error);
                return false;
            }
        },
        [fetchToken, createConversation, connectWebSocket, handleWebSocketMessage]
    );

    const sendMessage = useCallback(
        async (text: string): Promise<boolean> => {
            if (!sessionState.isActive || !sessionState.conversationId || !token) {
                return false;
            }

            const userMessage: ConversationMessage = {
                role: "user",
                text,
                timestamp: new Date().toISOString(),
            };

            setSessionState((prev) => ({
                ...prev,
                messages: [...prev.messages, userMessage],
            }));

            if (sessionState.documentId && conversationContentRef.current) {
                await addMessageToConversation(
                    sessionState.documentId,
                    documentVersionRef.current,
                    documentNameRef.current,
                    conversationContentRef.current,
                    "user",
                    text
                );
                documentVersionRef.current = String(Number(documentVersionRef.current) + 1);
            }

            try {
                const response = await fetch(
                    `https://directline.botframework.com/v3/directline/conversations/${sessionState.conversationId}/activities`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            type: "message",
                            from: { id: "user" },
                            text,
                        }),
                    }
                );

                return response.ok;
            } catch (error) {
                console.error("Failed to send message:", error);
                return false;
            }
        },
        [sessionState, token, addMessageToConversation]
    );

    const endSession = useCallback(() => {
        disconnectWebSocket();
        setSessionState({
            isActive: false,
            documentId: null,
            conversationId: null,
            messages: [],
        });
        conversationContentRef.current = null;
    }, [disconnectWebSocket]);

    return {
        sessionState,
        startNewSession,
        resumeSession,
        sendMessage,
        endSession,
        getConversationHistory,
        refetchList,
    };
};