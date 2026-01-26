import { useState, useCallback, useRef } from "react";
import { functions } from "@dynatrace-sdk/app-utils";

export interface DirectLineConversation {
    conversationId: string;
    token: string;
    expires_in: number;
    streamUrl: string;
    referenceGrammarId?: string;
}

export interface DirectLineActivity {
    type: string;
    id?: string;
    timestamp?: string;
    from?: {
        id: string;
        name?: string;
        role?: string;
    };
    text?: string;
    attachments?: unknown[];
}

export interface DirectLineMessage {
    activities: DirectLineActivity[];
    watermark: string;
}

export const useDirectLineConversation = () => {
    const [conversation, setConversation] = useState<DirectLineConversation | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watermarkRef = useRef<string | undefined>(undefined);
    const onMessageCallbackRef = useRef<((data: DirectLineMessage) => void) | null>(null);
    const isPollingRef = useRef(false);

    const pollActivities = useCallback(async (conv: DirectLineConversation) => {
        if (isPollingRef.current) {
            return;
        }
        
        isPollingRef.current = true;
        
        try {
            const response = await functions.call("directline", {
                data: {
                    action: "getActivities",
                    token: conv.token,
                    conversationId: conv.conversationId,
                    watermark: watermarkRef.current,
                },
            });

            const data = (await response.json()) as DirectLineMessage;
            
            if (data.watermark) {
                watermarkRef.current = data.watermark;
            }

            if (data.activities && data.activities.length > 0 && onMessageCallbackRef.current) {
                console.log("[useDirectLineConversation] Polling received activities:", data.activities.length);
                onMessageCallbackRef.current(data);
            }
        } catch (error) {
            console.error("[useDirectLineConversation] Polling error:", error);
        } finally {
            isPollingRef.current = false;
        }
    }, []);

    const startPolling = useCallback((conv: DirectLineConversation, onMessage: (data: DirectLineMessage) => void) => {
        console.log("[useDirectLineConversation] Starting polling for conversation:", conv.conversationId);
        
        onMessageCallbackRef.current = onMessage;
        watermarkRef.current = undefined;
        
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        setIsConnected(true);
        
        pollingIntervalRef.current = setInterval(() => {
            void pollActivities(conv);
        }, 2000);

        void pollActivities(conv);
    }, [pollActivities]);

    const stopPolling = useCallback(() => {
        console.log("[useDirectLineConversation] Stopping polling");
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setIsConnected(false);
        onMessageCallbackRef.current = null;
        watermarkRef.current = undefined;
    }, []);

    const createConversation = useCallback(
        async (token: string): Promise<DirectLineConversation | null> => {
            console.log("[useDirectLineConversation] Creating conversation with token");
            setIsLoading(true);
            try {
                const response = await functions.call("directline", {
                    data: {
                        action: "createConversation",
                        token,
                    },
                });

                console.log("[useDirectLineConversation] Create conversation response:", response);
                const data = (await response.json()) as DirectLineConversation;
                const conversationData: DirectLineConversation = {
                    ...data,
                    token,
                };
                console.log("[useDirectLineConversation] Conversation created:", conversationData.conversationId);
                setConversation(conversationData);
                return conversationData;
            } catch (error) {
                console.error("[useDirectLineConversation] Failed to create conversation:", error);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const sendActivity = useCallback(
        async (text: string, userId: string = "user"): Promise<boolean> => {
            console.log("[useDirectLineConversation] Sending activity:", text);
            if (!conversation) {
                console.error("[useDirectLineConversation] No active conversation");
                return false;
            }

            try {
                await functions.call("directline", {
                    data: {
                        action: "sendActivity",
                        token: conversation.token,
                        conversationId: conversation.conversationId,
                        text,
                        userId,
                    },
                });

                console.log("[useDirectLineConversation] Send activity success");
                return true;
            } catch (error) {
                console.error("[useDirectLineConversation] Failed to send activity:", error);
                return false;
            }
        },
        [conversation]
    );

    return {
        conversation,
        isConnected,
        isLoading,
        createConversation,
        startPolling,
        stopPolling,
        sendActivity,
    };
};