import { useCallback, useRef, useState } from "react";
import { useAppFunctionExecutor } from "./useAppFunctionExecutor";

export interface DirectLineConversation {
    conversationId: string;
    token: string;
    expiresIn?: number;
    streamUrl?: string;
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
    watermark?: string;
    timestamp: string;
}

interface CopilotDirectlineConversationInput {
    token: string;
}

interface CopilotDirectlineConversationOutput {
    conversationId: string;
    token?: string;
    expiresIn?: number;
    streamUrl?: string;
    timestamp: string;
}

interface CopilotDirectlineSendActivityInput {
    token: string;
    conversationId: string;
    text: string;
    userId?: string;
    history?: Array<{
        role: "user" | "assistant" | "system";
        content: string;
        timestamp: string;
    }>;
}

interface CopilotDirectlineActivitiesInput {
    token: string;
    conversationId: string;
    watermark?: string;
}

export const useDirectLineConversation = () => {
    const [conversation, setConversation] = useState<DirectLineConversation | null>(null);
    const conversationRef = useRef<DirectLineConversation | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const { executeAsync: createConversationRequest, isLoading } = useAppFunctionExecutor<
        CopilotDirectlineConversationInput,
        CopilotDirectlineConversationOutput
    >("copilot-directline-conversation");

    const { executeAsync: sendActivityRequest } = useAppFunctionExecutor<
        CopilotDirectlineSendActivityInput,
        { id: string; timestamp: string }
    >("copilot-directline-send-activity");

    const { executeAsync: getActivitiesRequest } = useAppFunctionExecutor<
        CopilotDirectlineActivitiesInput,
        DirectLineMessage
    >("copilot-directline-activities");
    
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watermarkRef = useRef<string | undefined>(undefined);
    const onMessageCallbackRef = useRef<
        ((data: DirectLineMessage) => void | Promise<void>) | null
    >(null);
    const isPollingRef = useRef(false);

    const pollActivities = useCallback(async (conv: DirectLineConversation) => {
        if (isPollingRef.current) {
            return;
        }
        
        isPollingRef.current = true;
        
        try {
            const data = await getActivitiesRequest({
                token: conv.token,
                conversationId: conv.conversationId,
                watermark: watermarkRef.current,
            });
            
            if (data.watermark) {
                watermarkRef.current = data.watermark;
            }

            if (data.activities && data.activities.length > 0 && onMessageCallbackRef.current) {
                console.log("[useDirectLineConversation] Polling received activities:", data.activities.length);
                await onMessageCallbackRef.current(data);
            }
        } catch (error) {
            console.error("[useDirectLineConversation] Polling error:", error);
        } finally {
            isPollingRef.current = false;
        }
    }, [getActivitiesRequest]);

    const startPolling = useCallback(
        (conv: DirectLineConversation, onMessage: (data: DirectLineMessage) => void | Promise<void>) => {
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
        },
        [pollActivities]
    );

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
            try {
                const data = await createConversationRequest({ token });
                const conversationData: DirectLineConversation = {
                    conversationId: data.conversationId,
                    token: data.token ?? token,
                    expiresIn: data.expiresIn,
                    streamUrl: data.streamUrl,
                    referenceGrammarId: conversation?.referenceGrammarId,
                };
                console.log("[useDirectLineConversation] Conversation created:", conversationData.conversationId);
                conversationRef.current = conversationData;
                setConversation(conversationData);
                return conversationData;
            } catch (error) {
                console.error("[useDirectLineConversation] Failed to create conversation:", error);
                return null;
            }
        },
        [conversation?.referenceGrammarId, createConversationRequest]
    );


    const sendActivity = useCallback(
        async (
            text: string,
            userId: string = "user",
            history?: CopilotDirectlineSendActivityInput["history"]
        ): Promise<boolean> => {
            console.log("[useDirectLineConversation] Sending activity:", text);
            const activeConversation = conversationRef.current ?? conversation;
            if (!activeConversation) {
                console.error("[useDirectLineConversation] No active conversation");
                return false;
            }

            try {
                await sendActivityRequest({
                    token: activeConversation.token,
                    conversationId: activeConversation.conversationId,
                    text,
                    userId,
                    history,
                });

                console.log("[useDirectLineConversation] Send activity success");
                return true;
            } catch (error) {
                console.error("[useDirectLineConversation] Failed to send activity:", error);
                return false;
            }
        },
        [conversation, sendActivityRequest]
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
