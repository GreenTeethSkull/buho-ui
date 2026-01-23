import { useState, useCallback, useRef, useEffect } from "react";

const DIRECTLINE_URL = "https://directline.botframework.com/v3/directline/conversations";

export interface DirectLineConversation {
    conversationId: string;
    token: string;
    expires_in: number;
    streamUrl: string;
    referenceGrammarId: string;
}

export const useDirectLineConversation = () => {
    const [conversation, setConversation] = useState<DirectLineConversation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const createConversation = useCallback(async (token: string): Promise<DirectLineConversation | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(DIRECTLINE_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to create conversation: ${response.status}`);
            }

            const data: DirectLineConversation = await response.json();
            setConversation(data);
            return data;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const connectWebSocket = useCallback((streamUrl: string, onMessage: (data: unknown) => void) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(streamUrl);

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch {
                console.error("Failed to parse WebSocket message");
            }
        };

        ws.onerror = (event) => {
            console.error("WebSocket error:", event);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        wsRef.current = ws;
        return ws;
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, [disconnectWebSocket]);

    return {
        conversation,
        createConversation,
        connectWebSocket,
        disconnectWebSocket,
        isLoading,
        error,
    };
};