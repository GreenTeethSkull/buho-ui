import { useCallback, useRef } from "react";
import { useAppFunctionExecutor } from "./useAppFunctionExecutor";

const POLLING_INTERVAL_MS = 15_000;
const MAX_POLLING_TIME_MS = 300_000;
const PROGRESS_INTERVAL_MS = 1_000;

const PROGRESS_MESSAGES: Record<number, string> = {
    60: "Estoy analizando toda la información para darte la mejor respuesta...",
    120: "Continúo analizando la información, gracias por tu paciencia...",
    180: "El análisis es más extenso de lo esperado, sigo trabajando en ello...",
    240: "Casi listo, proceso la información restante...",
};

interface SendMessageInput {
    text: string;
    copilotConversationId?: string;
}

interface SendMessageOutput {
    status: string;
    executionId: string;
    rowId: string;
    message: string;
    receivedAt: string;
    channelId: string;
}

interface PollResponseInput {
    rowId: string;
}

interface PollResponseOutput {
    executionId: string;
    conversationId: string;
    status: string;
    response: string;
}

export interface PollingResult {
    response: string;
    conversationId: string;
}

export type ProgressCallback = (elapsedSeconds: number, message: string | null) => void;

export const usePollingResponse = () => {
    const { executeAsync: sendAppFunction } = useAppFunctionExecutor<SendMessageInput, SendMessageOutput>(
        "copilot-send-message"
    );
    const { executeAsync: pollAppFunction } = useAppFunctionExecutor<PollResponseInput, PollResponseOutput>(
        "copilot-poll-response"
    );

    const isPollingRef = useRef(false);

    const sendWithPolling = useCallback(
        async (
            text: string,
            copilotConversationId: string | null,
            onProgress?: ProgressCallback
        ): Promise<PollingResult> => {
            if (isPollingRef.current) {
                throw new Error("A polling session is already in progress.");
            }
            isPollingRef.current = true;

            try {
                const sendResult = await sendAppFunction({
                    text,
                    copilotConversationId: copilotConversationId ?? undefined,
                });

                const { rowId } = sendResult;

                return await new Promise<PollingResult>((resolve, reject) => {
                    let elapsed = 0;
                    let lastProgressMinute = 0;

                    const cleanup = () => {
                        clearInterval(pollIntervalId);
                        clearInterval(elapsedIntervalId);
                        clearTimeout(timeoutId);
                        isPollingRef.current = false;
                    };

                    const pollOnce = async () => {
                        try {
                            const result = await pollAppFunction({ rowId });

                            if (result.status === "1" && result.response) {
                                cleanup();
                                resolve({
                                    response: result.response,
                                    conversationId: result.conversationId,
                                });
                            }
                        } catch (err) {
                            cleanup();
                            reject(err instanceof Error ? err : new Error(String(err)));
                        }
                    };

                    const pollIntervalId = setInterval(() => { void pollOnce(); }, POLLING_INTERVAL_MS);

                    const elapsedIntervalId = setInterval(() => {
                        elapsed += 1;
                        const currentMinute = Math.floor(elapsed / 60);
                        if (currentMinute > lastProgressMinute && PROGRESS_MESSAGES[currentMinute]) {
                            lastProgressMinute = currentMinute;
                            onProgress?.(elapsed, PROGRESS_MESSAGES[currentMinute]);
                        }
                    }, PROGRESS_INTERVAL_MS);

                    const timeoutId = setTimeout(() => {
                        cleanup();
                        reject(
                            new Error(
                                "La respuesta ha tardado más de lo esperado. Por favor, intenta nuevamente."
                            )
                        );
                    }, MAX_POLLING_TIME_MS);

                    void pollOnce();
                });
            } catch (error) {
                isPollingRef.current = false;
                throw error;
            }
        },
        [sendAppFunction, pollAppFunction]
    );

    return { sendWithPolling };
};
