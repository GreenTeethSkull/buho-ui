import { isRecord, readNonEmptyString, readOptionalNumber, readOptionalString } from './copilot-directline.shared';

const DIRECTLINE_CONVERSATION_URL = 'https://directline.botframework.com/v3/directline/conversations';

export interface CopilotDirectlineConversationInput {
    token: string;
}

export interface CopilotDirectlineConversationOutput {
    conversationId: string;
    token?: string;
    expiresIn?: number;
    streamUrl?: string;
    timestamp: string;
}

type DirectLineConversationResponse = {
    conversationId: string;
    token?: string;
    expires_in?: number;
    streamUrl?: string;
};

const isDirectLineConversationResponse = (value: unknown): value is DirectLineConversationResponse => {
    if (!isRecord(value)) {
        return false;
    }

    const conversationId = readNonEmptyString(value.conversationId);
    if (!conversationId) {
        return false;
    }

    const token = readOptionalString(value.token);
    if (value.token !== undefined && !token) {
        return false;
    }

    const expiresIn = readOptionalNumber(value.expires_in);
    if (value.expires_in !== undefined && expiresIn === undefined) {
        return false;
    }

    const streamUrl = readOptionalString(value.streamUrl);
    if (value.streamUrl !== undefined && !streamUrl) {
        return false;
    }

    return true;
};

export default async function (
    payload: CopilotDirectlineConversationInput
): Promise<CopilotDirectlineConversationOutput> {
    const token = readNonEmptyString(payload.token);
    if (!token) {
        throw new Error('Token is required to create a Direct Line conversation.');
    }

    const response = await fetch(DIRECTLINE_CONVERSATION_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const details = errorBody ? ` - ${errorBody}` : '';
        throw new Error(
            `Direct Line create conversation failed (HTTP ${response.status}): ${response.statusText}${details}`
        );
    }

    const responseBody: unknown = await response.json();

    if (!isDirectLineConversationResponse(responseBody)) {
        throw new Error('Unexpected response from Direct Line conversation endpoint.');
    }

    return {
        conversationId: responseBody.conversationId,
        token: responseBody.token,
        expiresIn: responseBody.expires_in,
        streamUrl: responseBody.streamUrl,
        timestamp: new Date().toISOString(),
    };
}
