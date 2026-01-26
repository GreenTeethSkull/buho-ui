import { useState, useCallback } from "react";
import { functions } from "@dynatrace-sdk/app-utils";

export interface DirectLineTokenResponse {
    conversationId: string;
    token: string;
    expires_in: number;
}

export const useDirectLineToken = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchToken = useCallback(async (): Promise<DirectLineTokenResponse | null> => {
        console.log("[useDirectLineToken] Fetching token via App Function...");
        setIsLoading(true);
        setError(null);
        try {
            const response = await functions.call("directline", {
                data: {
                    action: "generateToken",
                },
            });

            console.log("[useDirectLineToken] Raw response:", response);
            const data = (await response.json()) as DirectLineTokenResponse;
            console.log("[useDirectLineToken] Token received, conversationId:", data.conversationId);
            setToken(data.token);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error");
            console.error("[useDirectLineToken] Error fetching token:", error);
            setError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { token, fetchToken, isLoading, error };
};