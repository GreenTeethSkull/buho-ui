import { logsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { getCurrentUserDetails } from "@dynatrace-sdk/app-environment";

interface ChatLogEntry {
    owner: string;
    conversationId: string;
    model: string;
    role: "user" | "assistant" | "system";
    text: string;
}

const LOG_SOURCE = "lucy.app";
const LOG_LEVEL = "INFO";

const getUserIdentity = (): string => {
    try {
        const userDetails = getCurrentUserDetails();
        console.log("[logService] User details:", JSON.stringify(userDetails));
        return userDetails.email || userDetails.name || userDetails.id || "unknown";
    } catch (e) {
        console.warn("[logService] Could not get user details:", e);
        return "unknown";
    }
};

export const sendChatLog = (params: {
    conversationId: string;
    model: string;
    role: "user" | "assistant" | "system";
    text: string;
    timestamp: string;
}): void => {
    const { conversationId, model, role, text, timestamp } = params;

    const content: ChatLogEntry = {
        owner: getUserIdentity(),
        conversationId,
        model,
        role,
        text,
    };

    logsClient
        .storeLog({
            type: "application/json; charset=utf-8",
            body: [
                {
                    content: JSON.stringify(content),
                    "log.source": LOG_SOURCE,
                    timestamp,
                    loglevel: LOG_LEVEL,
                },
            ],
        })
        .catch((error) => {
            console.error("[logService] Failed to send log to Dynatrace:", error?.message || error);
        });
};