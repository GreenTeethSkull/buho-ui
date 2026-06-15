import { useCallback, useRef } from "react";
import { useAppFunctionExecutor } from "./useAppFunctionExecutor";

const POLL_RETRY_DELAY_MS = 2_000;
const MAX_POLLING_TIME_MS = 600_000;

const PROGRESS_MESSAGES: Record<number, string> = {
    1: "Estoy analizando toda la información para darte la mejor respuesta...",
    2: "Continúo analizando la información, gracias por tu paciencia...",
    3: "El análisis es más extenso de lo esperado, sigo trabajando en ello...",
    4: "Sigo procesando los datos, esto puede tomar unos minutos más...",
    5: "Reviso los detalles para asegurar una respuesta completa...",
    6: "Aún estoy trabajando en ello, agradezco tu paciencia...",
    7: "Estoy organizando toda la información recopilada...",
    8: "Ya casi termino, afino los últimos detalles...",
    9: "Casi listo, proceso la información restante...",
};

interface SendMessageInput {
  text: string;
  copilotConversationId?: string;
}

interface SendMessageOutput {
  trackingId: string;
  retryAfter: number;
}

interface PollResponseInput {
  trackingId: string;
}

type PollResponseOutput =
  | { status: "completed"; conversationId: string; response: string }
  | { status: "running"; trackingId: string };

export interface PollingResult {
  response: string;
  conversationId: string;
}

export type ProgressCallback = (
  elapsedSeconds: number,
  message: string | null,
) => void;

export const usePollingResponse = () => {
  const { executeAsync: sendAppFunction } = useAppFunctionExecutor<
    SendMessageInput,
    SendMessageOutput
  >("copilot-send-message");
  const { executeAsync: pollAppFunction } = useAppFunctionExecutor<
    PollResponseInput,
    PollResponseOutput
  >("copilot-poll-response");

  const isPollingRef = useRef(false);

  const createPollLoop = useCallback(
    (startTime: number, onProgress?: ProgressCallback) => {
      let lastProgressMinute = 0;

      const checkProgress = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const currentMinute = Math.floor(elapsed / 60);
        if (
          currentMinute > lastProgressMinute &&
          PROGRESS_MESSAGES[currentMinute]
        ) {
          lastProgressMinute = currentMinute;
          onProgress?.(elapsed, PROGRESS_MESSAGES[currentMinute]);
        }
      };

      const pollLoop = async (trackingId: string): Promise<PollingResult> => {
        checkProgress();

        if (Date.now() - startTime >= MAX_POLLING_TIME_MS) {
          throw new Error(
            "La respuesta ha tardado más de lo esperado. Por favor, intenta nuevamente.",
          );
        }

        const pollResult = await pollAppFunction({ trackingId });

        if (pollResult.status === "completed") {
          return {
            response: pollResult.response,
            conversationId: pollResult.conversationId,
          };
        }

        await new Promise<void>((resolve) =>
          setTimeout(resolve, POLL_RETRY_DELAY_MS),
        );

        return pollLoop(pollResult.trackingId);
      };

      return pollLoop;
    },
    [pollAppFunction],
  );

  const sendMessage = useCallback(
    async (
      text: string,
      copilotConversationId: string | null,
    ): Promise<SendMessageOutput> => {
      return sendAppFunction({
        text,
        copilotConversationId: copilotConversationId ?? undefined,
      });
    },
    [sendAppFunction],
  );

  const pollFromTrackingId = useCallback(
    async (
      trackingId: string,
      onProgress?: ProgressCallback,
    ): Promise<PollingResult> => {
      if (isPollingRef.current) {
        throw new Error("A polling session is already in progress.");
      }
      isPollingRef.current = true;

      try {
        const pollLoop = createPollLoop(Date.now(), onProgress);
        const result = await pollLoop(trackingId);
        isPollingRef.current = false;
        return result;
      } catch (error) {
        isPollingRef.current = false;
        throw error;
      }
    },
    [createPollLoop],
  );

  const sendWithPolling = useCallback(
    async (
      text: string,
      copilotConversationId: string | null,
      onProgress?: ProgressCallback,
    ): Promise<PollingResult> => {
      const sendResult = await sendMessage(text, copilotConversationId);
      return pollFromTrackingId(sendResult.trackingId, onProgress);
    },
    [sendMessage, pollFromTrackingId],
  );

  const resumeFromTrackingId = useCallback(
    async (
      trackingId: string,
      onProgress?: ProgressCallback,
    ): Promise<PollingResult> => {
      return pollFromTrackingId(trackingId, onProgress);
    },
    [pollFromTrackingId],
  );

  return {
    sendMessage,
    pollFromTrackingId,
    sendWithPolling,
    resumeFromTrackingId,
  };
};
