import { useCallback, useRef } from "react";
import { useAppFunctionExecutor } from "./useAppFunctionExecutor";

const POLLING_INTERVAL_MS = 7_000;
const MAX_POLLING_TIME_MS = 300_000;

const PROGRESS_MESSAGES: Record<number, string> = {
    1: "Estoy analizando toda la información para darte la mejor respuesta...",
    2: "Continúo analizando la información, gracias por tu paciencia...",
    3: "El análisis es más extenso de lo esperado, sigo trabajando en ello...",
    4: "Casi listo, proceso la información restante...",
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

            const startTime = Date.now();
            let lastProgressMinute = 0;

            const getElapsedSeconds = () => Math.floor((Date.now() - startTime) / 1000);

            const checkProgress = () => {
                const elapsed = getElapsedSeconds();
                const currentMinute = Math.floor(elapsed / 60);
                if (currentMinute > lastProgressMinute && PROGRESS_MESSAGES[currentMinute]) {
                    lastProgressMinute = currentMinute;
                    onProgress?.(elapsed, PROGRESS_MESSAGES[currentMinute]);
                }
            };

            try {
                const sendResult = await sendAppFunction({
                    text,
                    copilotConversationId: copilotConversationId ?? undefined,
                });

                const { rowId } = sendResult;

                const pollLoop = (): Promise<PollingResult> =>
                    new Promise<PollingResult>((resolve, reject) => {
                        checkProgress();

                        if (getElapsedSeconds() * 1000 >= MAX_POLLING_TIME_MS) {
                            reject(
                                new Error(
                                    "La respuesta ha tardado más de lo esperado. Por favor, intenta nuevamente."
                                )
                            );
                            return;
                        }

                        void pollAppFunction({ rowId })
                            .then((result) => {
                                checkProgress();

                                if (result.status === "1" && result.response) {
                                    resolve({
                                        response: result.response,
                                        conversationId: result.conversationId,
                                    });
                                } else {
                                    setTimeout(() => {
                                        void pollLoop().then(resolve, reject);
                                    }, POLLING_INTERVAL_MS);
                                }
                            })
                            .catch((err) => {
                                reject(err instanceof Error ? err : new Error(String(err)));
                            });
                    });

                const result = await pollLoop();
                isPollingRef.current = false;
                return result;
            } catch (error) {
                isPollingRef.current = false;
                throw error;
            }
        },
        [sendAppFunction, pollAppFunction]
    );

    return { sendWithPolling };
};
