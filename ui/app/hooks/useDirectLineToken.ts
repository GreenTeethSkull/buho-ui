import { useCallback, useState } from "react";
import { useAppFunctionExecutor } from "./useAppFunctionExecutor";

export interface DirectLineTokenResponse {
    token: string;
    conversationId?: string;
    expiresIn?: number;
    timestamp: string;
}

export interface CopilotDirectlineTokenInput {
    metadata?: {
        user?: string;
        [key: string]: unknown;
    };
}


export const useDirectLineToken = () => {
    const [token, setToken] = useState<string | null>(null);
    const {
        executeAsync,
        isLoading,
        error,
    } = useAppFunctionExecutor<CopilotDirectlineTokenInput, DirectLineTokenResponse>(
        "copilot-directline-token"
    );

    const fetchToken = useCallback(async (
        payload: CopilotDirectlineTokenInput = {}
    ): Promise<DirectLineTokenResponse | null> => {
        console.log("[useDirectLineToken] Fetching token via App Function...");
        try {
            const data = await executeAsync(payload);
            console.log("[useDirectLineToken] Token received, conversationId:", data.conversationId);
            setToken(data.token);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error");
            console.error("[useDirectLineToken] Error fetching token:", error);
            return null;
        }
    }, [executeAsync]);

    return { token, fetchToken, isLoading, error };
};
