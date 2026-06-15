import { useState, useCallback, useRef } from "react";
import { useConversationManager } from "./useConversationManager";
import { usePollingResponse } from "./usePollingResponse";
import type { ConversationDocument, ConversationMessage } from "../domain/conversation";
import { sendChatLog } from "../services/logService";

export interface ChatSessionState {
    isActive: boolean;
    documentId: string | null;
    conversationId: string | null;
    messages: ConversationMessage[];
    isSending: boolean;
}

const STALE_TIMEOUT_MS = 600_000;
const max_lenght = 40;

const generateTitle = (text: string): string => {
    const trimmed = text.trim();
    return trimmed.length > max_lenght ? trimmed.slice(0, max_lenght).trimEnd() + "…" : trimmed;
};

export const useChatSession = () => {
    const [sessionState, setSessionState] = useState<ChatSessionState>({
        isActive: false,
        documentId: null,
        conversationId: null,
        messages: [],
        isSending: false,
    });

    const { sendMessage: sendToBot, pollFromTrackingId, resumeFromTrackingId } = usePollingResponse();

    const {
        createConversation: createConversationDoc,
        updateConversation,
    } = useConversationManager();

    const conversationContentRef = useRef<ConversationDocument | null>(null);
    const documentVersionRef = useRef<string>("1");
    const documentNameRef = useRef<string>("");
    const documentIdRef = useRef<string | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const copilotConversationIdRef = useRef<string | null>(null);

    const persistConversation = useCallback(async () => {
        if (!documentIdRef.current || !conversationContentRef.current) return;
        const updatedVersion = await updateConversation(
            documentIdRef.current,
            documentVersionRef.current,
            documentNameRef.current,
            conversationContentRef.current
        );
        if (updatedVersion) {
            documentVersionRef.current = updatedVersion;
        }
    }, [updateConversation]);

    const setPendingPoll = useCallback(
        async (trackingId: string) => {
            if (!conversationContentRef.current) return;
            conversationContentRef.current = {
                ...conversationContentRef.current,
                pendingPollTrackingId: trackingId,
                pendingPollCreatedAt: Date.now(),
            };
            await persistConversation();
        },
        [persistConversation]
    );

    const clearPendingPoll = useCallback(async () => {
        if (!conversationContentRef.current) return;
        conversationContentRef.current = {
            ...conversationContentRef.current,
            pendingPollTrackingId: undefined,
            pendingPollCreatedAt: undefined,
        };
        await persistConversation();
    }, [persistConversation]);

    const addAssistantMessage = useCallback(
        async (response: string, conversationId: string) => {
            const botMessage: ConversationMessage = {
                role: "assistant",
                content: response,
                timestamp: new Date().toISOString(),
            };

            setSessionState((prev) => {
                const filtered = prev.messages.filter((m) => m.role !== "system");
                return { ...prev, messages: [...filtered, botMessage] };
            });

            if (documentIdRef.current && conversationContentRef.current) {
                const filtered = conversationContentRef.current.messages.filter((m) => m.role !== "system");
                conversationContentRef.current = {
                    ...conversationContentRef.current,
                    messages: [...filtered, botMessage],
                };
            }

            sendChatLog({
                conversationId,
                model: conversationContentRef.current?.modelId ?? "",
                role: "assistant",
                text: response,
                timestamp: botMessage.timestamp,
            });

            await persistConversation();
        },
        [persistConversation]
    );

    const startNewSession = useCallback(
        async (modelId: string): Promise<boolean> => {
            try {
                const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const now = new Date().toISOString();
                const initialContent: ConversationDocument = {
                    conversationId,
                    modelId,
                    messages: [],
                    createdAt: now,
                    updatedAt: now,
                };

                const docResult = await createConversationDoc({
                    id: conversationId,
                    name: `Chat ${conversationId}`,
                    initialContent,
                });

                if (!docResult?.id) return false;

                documentIdRef.current = docResult.id;
                documentVersionRef.current = docResult.version || "1";
                documentNameRef.current = `Chat ${conversationId}`;
                conversationContentRef.current = initialContent;
                conversationIdRef.current = conversationId;
                copilotConversationIdRef.current = null;

                setSessionState({
                    isActive: true,
                    documentId: docResult.id,
                    conversationId,
                    messages: [],
                    isSending: false,
                });

                return true;
            } catch (error) {
                console.error("[useChatSession] Error starting new session:", error);
                return false;
            }
        },
        [createConversationDoc]
    );

    const resumeSession = useCallback(
        async (
            docId: string,
            conversationData: ConversationDocument,
            version: string,
            name: string
        ): Promise<boolean> => {
            try {
                documentIdRef.current = docId;
                documentVersionRef.current = version;
                documentNameRef.current = name;
                conversationContentRef.current = conversationData;
                conversationIdRef.current = conversationData.conversationId;
                copilotConversationIdRef.current = conversationData.copilotConversationId ?? null;

                setSessionState({
                    isActive: true,
                    documentId: docId,
                    conversationId: conversationData.conversationId,
                    messages: conversationData.messages || [],
                    isSending: false,
                });

                const { pendingPollTrackingId, pendingPollCreatedAt } = conversationData;

                if (pendingPollTrackingId) {
                    const now = Date.now();
                    const isStale = pendingPollCreatedAt
                        ? now - pendingPollCreatedAt >= STALE_TIMEOUT_MS
                        : false;

                    if (isStale) {
                        await clearPendingPoll();
                        return true;
                    }

                    try {
                        setSessionState((prev) => ({ ...prev, isSending: true }));

                        const result = await resumeFromTrackingId(
                            pendingPollTrackingId,
                            (elapsedSeconds, progressMessage) => {
                                if (progressMessage) {
                                    const systemMessage: ConversationMessage = {
                                        role: "system",
                                        content: progressMessage,
                                        timestamp: new Date().toISOString(),
                                    };
                                    setSessionState((prev) => ({
                                        ...prev,
                                        messages: [...prev.messages, systemMessage],
                                    }));
                                    if (documentIdRef.current && conversationContentRef.current) {
                                        conversationContentRef.current = {
                                            ...conversationContentRef.current,
                                            messages: [...conversationContentRef.current.messages, systemMessage],
                                        };
                                    }
                                }
                            }
                        );

                        if (result.conversationId) {
                            copilotConversationIdRef.current = result.conversationId;
                            if (conversationContentRef.current) {
                                conversationContentRef.current = {
                                    ...conversationContentRef.current,
                                    copilotConversationId: result.conversationId,
                                };
                            }
                        }

                        await clearPendingPoll();
                        await addAssistantMessage(result.response, conversationData.conversationId);
                    } catch {
                        await clearPendingPoll();
                    } finally {
                        setSessionState((prev) => ({ ...prev, isSending: false }));
                    }
                }

                return true;
            } catch (error) {
                console.error("[useChatSession] Error resuming session:", error);
                return false;
            }
        },
        [resumeFromTrackingId, addAssistantMessage, clearPendingPoll]
    );

    const sendMessage = useCallback(
        async (text: string): Promise<boolean> => {
            const currentConversationId = conversationIdRef.current || sessionState.conversationId;
            if (!currentConversationId) return false;

            setSessionState((prev) => ({ ...prev, isSending: true }));

            const isFirstMessage = (conversationContentRef.current?.messages ?? []).length === 0;
            if (isFirstMessage && conversationContentRef.current) {
                const title = generateTitle(text);
                documentNameRef.current = title;
                conversationContentRef.current = { ...conversationContentRef.current, title };
            }

            const userMessage: ConversationMessage = {
                role: "user",
                content: text,
                timestamp: new Date().toISOString(),
            };

            setSessionState((prev) => ({
                ...prev,
                messages: [...prev.messages, userMessage],
            }));

            sendChatLog({
                conversationId: currentConversationId,
                model: conversationContentRef.current?.modelId ?? "",
                role: "user",
                text,
                timestamp: userMessage.timestamp,
            });

            if (documentIdRef.current && conversationContentRef.current) {
                conversationContentRef.current = {
                    ...conversationContentRef.current,
                    messages: [...conversationContentRef.current.messages, userMessage],
                };
            }

            if (isFirstMessage) {
                await persistConversation();
            }

            try {
                const sendResult = await sendToBot(
                    text,
                    copilotConversationIdRef.current
                );

                await setPendingPoll(sendResult.trackingId);

                const result = await pollFromTrackingId(
                    sendResult.trackingId,
                    (elapsedSeconds, progressMessage) => {
                        if (progressMessage) {
                            const systemMessage: ConversationMessage = {
                                role: "system",
                                content: progressMessage,
                                timestamp: new Date().toISOString(),
                            };
                            setSessionState((prev) => ({
                                ...prev,
                                messages: [...prev.messages, systemMessage],
                            }));
                            if (documentIdRef.current && conversationContentRef.current) {
                                conversationContentRef.current = {
                                    ...conversationContentRef.current,
                                    messages: [...conversationContentRef.current.messages, systemMessage],
                                };
                            }
                        }
                    }
                );

                if (result.conversationId) {
                    copilotConversationIdRef.current = result.conversationId;
                    if (conversationContentRef.current) {
                        conversationContentRef.current = {
                            ...conversationContentRef.current,
                            copilotConversationId: result.conversationId,
                        };
                    }
                }

                await clearPendingPoll();

                await addAssistantMessage(result.response, currentConversationId);
                return true;
            } catch (error) {
                console.error("[useChatSession] Error sending message:", error);
                await clearPendingPoll();
                const errorMessage: ConversationMessage = {
                    role: "system",
                    content: error instanceof Error
                        ? error.message
                        : "Se ha producido un error al generar la respuesta. Por favor, intenta nuevamente.",
                    timestamp: new Date().toISOString(),
                };
                setSessionState((prev) => {
                    const filtered = prev.messages.filter((m) => m.role !== "system");
                    return { ...prev, messages: [...filtered, errorMessage] };
                });
                return false;
            } finally {
                setSessionState((prev) => ({ ...prev, isSending: false }));
            }
        },
        [persistConversation, sendToBot, pollFromTrackingId, sessionState.conversationId, addAssistantMessage, setPendingPoll, clearPendingPoll]
    );

    const endSession = useCallback(() => {
        documentIdRef.current = null;
        conversationContentRef.current = null;
        conversationIdRef.current = null;
        copilotConversationIdRef.current = null;
        setSessionState({
            isActive: false,
            documentId: null,
            conversationId: null,
            messages: [],
            isSending: false,
        });
    }, []);

    return {
        sessionState,
        startNewSession,
        resumeSession,
        sendMessage,
        endSession,
    };
};
