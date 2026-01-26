const DIRECT_LINE_SECRET = "";

interface DirectLinePayload {
    action: "generateToken" | "createConversation" | "sendActivity" | "getActivities";
    token?: string;
    conversationId?: string;
    text?: string;
    userId?: string;
    watermark?: string;
}

export default async function (payload: DirectLinePayload) {
    console.log("[DirectLine Function] Received action:", payload.action);

    try {
        switch (payload.action) {
            case "generateToken": {
                console.log("[DirectLine Function] Generating token...");
                const response = await fetch(
                    "https://directline.botframework.com/v3/directline/tokens/generate",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${DIRECT_LINE_SECRET}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[DirectLine Function] Token generation failed:", response.status, errorText);
                    throw new Error(`Failed to generate token: ${response.status}`);
                }

                const data = await response.json();
                console.log("[DirectLine Function] Token generated successfully, conversationId:", data.conversationId);
                return data;
            }

            case "createConversation": {
                if (!payload.token) {
                    throw new Error("Token is required for createConversation");
                }
                console.log("[DirectLine Function] Creating conversation...");
                const response = await fetch(
                    "https://directline.botframework.com/v3/directline/conversations",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${payload.token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[DirectLine Function] Create conversation failed:", response.status, errorText);
                    throw new Error(`Failed to create conversation: ${response.status}`);
                }

                const data = await response.json();
                console.log("[DirectLine Function] Conversation created:", data.conversationId);
                return data;
            }

            case "sendActivity": {
                if (!payload.token || !payload.conversationId || !payload.text) {
                    throw new Error("Token, conversationId, and text are required for sendActivity");
                }
                console.log("[DirectLine Function] Sending activity to conversation:", payload.conversationId);
                const response = await fetch(
                    `https://directline.botframework.com/v3/directline/conversations/${payload.conversationId}/activities`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${payload.token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            type: "message",
                            from: { id: payload.userId || "user" },
                            text: payload.text,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[DirectLine Function] Send activity failed:", response.status, errorText);
                    throw new Error(`Failed to send activity: ${response.status}`);
                }

                const data = await response.json();
                console.log("[DirectLine Function] Activity sent, id:", data.id);
                return data;
            }

            case "getActivities": {
                if (!payload.token || !payload.conversationId) {
                    throw new Error("Token and conversationId are required for getActivities");
                }
                const watermarkParam = payload.watermark ? `?watermark=${payload.watermark}` : "";
                console.log("[DirectLine Function] Getting activities for conversation:", payload.conversationId, "watermark:", payload.watermark);
                
                const response = await fetch(
                    `https://directline.botframework.com/v3/directline/conversations/${payload.conversationId}/activities${watermarkParam}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${payload.token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[DirectLine Function] Get activities failed:", response.status, errorText);
                    throw new Error(`Failed to get activities: ${response.status}`);
                }

                const data = await response.json();
                console.log("[DirectLine Function] Activities retrieved, count:", data.activities?.length || 0);
                return data;
            }

            default:
                throw new Error(`Unknown action: ${payload.action}`);
        }
    } catch (error) {
        console.error("[DirectLine Function] Error:", error);
        throw error;
    }
}