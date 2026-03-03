import { useState, useCallback, useRef } from "react";
import { useDirectLineToken } from "./useDirectLineToken";
import {
    useDirectLineConversation,
    DirectLineMessage,
    DirectLineConversation,
} from "./useDirectLineConversation";
import { useConversationManager } from "./useConversationManager";
import type { ConversationDocument, ConversationMessage } from "../domain/conversation";
import { sendChatLog } from "../services/logService";

export interface ChatSessionState {
    isActive: boolean;
    documentId: string | null;
    conversationId: string | null;
    messages: ConversationMessage[];
    isConnecting: boolean;
    isSending: boolean;
}

export const useChatSession = () => {
    const [sessionState, setSessionState] = useState<ChatSessionState>({
        isActive: false,
        documentId: null,
        conversationId: null,
        messages: [],
        isConnecting: false,
        isSending: false,
    });

    const { fetchToken } = useDirectLineToken();
    const {
        conversation,
        isConnected,
        createConversation,
        startPolling,
        stopPolling,
        sendActivity,
    } = useDirectLineConversation();

    const {
        createConversation: createConversationDoc,
        updateConversation,
    } = useConversationManager();

    const processedActivityIds = useRef<Set<string>>(new Set());
    const conversationContentRef = useRef<ConversationDocument | null>(null);
    const documentVersionRef = useRef<string>("1");
    const documentNameRef = useRef<string>("");
    const documentIdRef = useRef<string | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const directLineConversationRef = useRef<DirectLineConversation | null>(null);
    const shouldIncludeHistoryRef = useRef(false);
    const pendingBotResponseRef = useRef<{
        resolve: () => void;
        timeoutId: ReturnType<typeof setTimeout> | null;
    } | null>(null);

    const RESPONSE_TIMEOUT_MS = 60000;

    const clearPendingBotResponse = useCallback(() => {
        if (pendingBotResponseRef.current?.timeoutId) {
            clearTimeout(pendingBotResponseRef.current.timeoutId);
        }
        pendingBotResponseRef.current = null;
    }, []);

    const resolvePendingBotResponse = useCallback(() => {
        if (!pendingBotResponseRef.current) {
            return;
        }

        pendingBotResponseRef.current.resolve();
        clearPendingBotResponse();
        stopPolling();
        setSessionState((prev) => ({ ...prev, isSending: false }));
    }, [clearPendingBotResponse, stopPolling]);

    const persistConversation = useCallback(async () => {
        if (!documentIdRef.current || !conversationContentRef.current) {
            return;
        }

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

    const handleBotMessage = useCallback(async (data: DirectLineMessage) => {
        console.log("[useChatSession] handleBotMessage called with:", data);
        if (!data.activities || data.activities.length === 0) {
            console.log("[useChatSession] No activities in message");
            return;
        }

        let receivedBotMessage = false;
        for (const activity of data.activities) {
            console.log("[useChatSession] Processing activity:", activity);
            
            if (!activity.id) {
                console.log("[useChatSession] Activity has no id, skipping");
                continue;
            }
            
            if (processedActivityIds.current.has(activity.id)) {
                console.log("[useChatSession] Activity already processed:", activity.id);
                continue;
            }

            processedActivityIds.current.add(activity.id);
            console.log("[useChatSession] Activity type:", activity.type, "from:", activity.from);

            if (
                activity.type === "message" &&
                activity.from?.role === "bot" &&
                activity.text
            ) {
                console.log("[useChatSession] Bot message received:", activity.text);
                receivedBotMessage = true;
                const botMessage: ConversationMessage = {
                    role: "assistant",
                    content: activity.text,
                    timestamp: activity.timestamp || new Date().toISOString(),
                };

                setSessionState((prev) => {
                    console.log("[useChatSession] Adding bot message to state");
                    return {
                        ...prev,
                        messages: [...prev.messages, botMessage],
                    };
                });

                if (documentIdRef.current && conversationContentRef.current) {
                    conversationContentRef.current = {
                        ...conversationContentRef.current,
                        messages: [...conversationContentRef.current.messages, botMessage],
                    };
                }

                sendChatLog({
                    conversationId: conversationIdRef.current ?? "",
                    model: conversationContentRef.current?.modelId ?? "",
                    role: "assistant",
                    text: activity.text,
                    timestamp: botMessage.timestamp,
                });
            }
        }
        if (receivedBotMessage) {
            await persistConversation();
            resolvePendingBotResponse();
        }
    }, [persistConversation, resolvePendingBotResponse]);

    const startNewSession = useCallback(
        async (modelId: string): Promise<boolean> => {
            console.log("[useChatSession] Starting new session with model:", modelId);
            try {
                setSessionState((prev) => ({
                    ...prev,
                    isConnecting: true,
                }));

                console.log("[useChatSession] Step 1: Fetching DirectLine token...");
                const tokenResponse = await fetchToken();
                if (!tokenResponse) {
                    console.error("[useChatSession] Failed to fetch token");
                    return false;
                }
                console.log("[useChatSession] Token received");

                const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                console.log("[useChatSession] Step 2: Creating document for:", conversationId);
                
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

                if (!docResult?.id) {
                    console.error("[useChatSession] Failed to create conversation document");
                    return false;
                }
                console.log("[useChatSession] Document created:", docResult.id);

                documentIdRef.current = docResult.id;
                documentVersionRef.current = docResult.version || "1";
                documentNameRef.current = `Chat ${conversationId}`;
                conversationContentRef.current = initialContent;
                conversationIdRef.current = conversationId;
                shouldIncludeHistoryRef.current = false;

                console.log("[useChatSession] Step 3: Creating DirectLine conversation...");
                const directLineConversation = await createConversation(tokenResponse.token);

                if (directLineConversation) {
                    console.log("[useChatSession] DirectLine conversation created:", directLineConversation.conversationId);
                    processedActivityIds.current.clear();
                    directLineConversationRef.current = directLineConversation;
                    
                    setSessionState({
                        isActive: true,
                        documentId: docResult.id,
                        conversationId,
                        messages: [],
                        isConnecting: false,
                        isSending: false,
                    });
                    
                    return true;
                } else {
                    console.error("[useChatSession] Failed to create DirectLine conversation");
                    conversationIdRef.current = null;
                    return false;
                }
            } catch (error) {
                console.error("[useChatSession] Error starting new session:", error);
                conversationIdRef.current = null;
                return false;
            } finally {
                setSessionState((prev) => ({
                    ...prev,
                    isConnecting: false,
                }));
            }
        },
        [fetchToken, createConversation, createConversationDoc]
    );

    const resumeSession = useCallback(
        async (
            docId: string,
            conversationData: ConversationDocument,
            version: string,
            name: string
        ): Promise<boolean> => {
            console.log("[useChatSession] Resuming session for document:", docId);
            try {
                setSessionState((prev) => ({
                    ...prev,
                    isConnecting: true,
                }));

                documentIdRef.current = docId;
                documentVersionRef.current = version;
                documentNameRef.current = name;
                conversationContentRef.current = conversationData;
                conversationIdRef.current = conversationData.conversationId;
                shouldIncludeHistoryRef.current = (conversationData.messages?.length ?? 0) > 0;

                console.log("[useChatSession] Fetching new token for resumed session...");
                const tokenResponse = await fetchToken();
                if (!tokenResponse) {
                    console.error("[useChatSession] Failed to fetch token for resume");
                    return false;
                }
                console.log("[useChatSession] Creating new DirectLine conversation for resumed session...");
                const directLineConversation = await createConversation(tokenResponse.token);
                if (!directLineConversation) {
                    console.error("[useChatSession] Failed to create DirectLine conversation for resume");
                    conversationIdRef.current = null;
                    return false;
                }
                processedActivityIds.current.clear();
                directLineConversationRef.current = directLineConversation;

                console.log("[useChatSession] Session resumed successfully");
                setSessionState({
                    isActive: true,
                    documentId: docId,
                    conversationId: conversationData.conversationId,
                    messages: conversationData.messages || [],
                    isConnecting: false,
                    isSending: false,
                });
                return true;
            } catch (error) {
                console.error("[useChatSession] Error resuming session:", error);
                conversationIdRef.current = null;
                return false;
            } finally {
                setSessionState((prev) => ({
                    ...prev,
                    isConnecting: false,
                }));
            }
        },
        [fetchToken, createConversation]
    );

    const sendMessage = useCallback(
        async (text: string): Promise<boolean> => {
            const currentConversationId = conversationIdRef.current || sessionState.conversationId;
            console.log("[useChatSession] sendMessage called:", text);
            console.log("[useChatSession] isConnected:", isConnected, "conversationId:", currentConversationId);
            
            if (!currentConversationId) {
                console.error("[useChatSession] No conversation ID");
                return false;
            }

            setSessionState((prev) => ({ ...prev, isSending: true }));

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

            const historyPayload = shouldIncludeHistoryRef.current
                ? [...(conversationContentRef.current?.messages ?? [])]
                : undefined;

            if (documentIdRef.current && conversationContentRef.current) {
                conversationContentRef.current = {
                    ...conversationContentRef.current,
                    messages: [...conversationContentRef.current.messages, userMessage],
                };
            }

            console.log("[useChatSession] Sending activity to DirectLine...");
            const success = await sendActivity(text, "user", historyPayload);
            console.log("[useChatSession] Send activity result:", success);
            if (!success) {
                setSessionState((prev) => ({ ...prev, isSending: false }));
                stopPolling();
                clearPendingBotResponse();
                return false;
            }

            if (shouldIncludeHistoryRef.current) {
                shouldIncludeHistoryRef.current = false;
            }

            const activeConversation = directLineConversationRef.current ?? conversation;
            if (!activeConversation) {
                console.error("[useChatSession] No active conversation for polling");
                setSessionState((prev) => ({ ...prev, isSending: false }));
                return false;
            }

            startPolling(activeConversation, handleBotMessage);

            try {
                await new Promise<void>((resolve) => {
                    clearPendingBotResponse();
                    const timeoutId = setTimeout(() => {
                        console.warn("[useChatSession] Timed out waiting for bot response");
                        clearPendingBotResponse();
                        stopPolling();
                        setSessionState((prev) => ({ ...prev, isSending: false }));
                        resolve();
                    }, RESPONSE_TIMEOUT_MS);

                    pendingBotResponseRef.current = { resolve, timeoutId };
                });
            } finally {
                clearPendingBotResponse();
            }

            return true;
        },
        [
            clearPendingBotResponse,
            conversation,
            handleBotMessage,
            isConnected,
            RESPONSE_TIMEOUT_MS,
            sendActivity,
            sessionState.conversationId,
            startPolling,
            stopPolling,
        ]
    );

    const endSession = useCallback(() => {
        console.log("[useChatSession] Ending session");
        stopPolling();
        processedActivityIds.current.clear();
        clearPendingBotResponse();
        documentIdRef.current = null;
        conversationContentRef.current = null;
        conversationIdRef.current = null;
        directLineConversationRef.current = null;
        shouldIncludeHistoryRef.current = false;
        setSessionState({
            isActive: false,
            documentId: null,
            conversationId: null,
            messages: [],
            isConnecting: false,
            isSending: false,
        });
    }, [stopPolling]);

    return {
        sessionState,
        isConnected,
        startNewSession,
        resumeSession,
        sendMessage,
        endSession,
    };
};