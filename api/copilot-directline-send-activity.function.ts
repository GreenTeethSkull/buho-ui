import { isRecord, readNonEmptyString, readOptionalString } from './copilot-directline.shared';

const buildActivitiesUrl = (conversationId: string) =>
    `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`;

export interface CopilotDirectlineSendActivityInput {
    token: string;
    conversationId: string;
    text: string;
    userId?: string;
    history?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
    }>;
}

export interface CopilotDirectlineSendActivityOutput {
    id: string;
    timestamp: string;
}

type DirectLineSendActivityResponse = {
    id: string;
};

const isDirectLineSendActivityResponse = (value: unknown): value is DirectLineSendActivityResponse => {
    if (!isRecord(value)) {
        return false;
    }

    const id = readNonEmptyString(value.id);
    return Boolean(id);
};

export default async function (
    payload: CopilotDirectlineSendActivityInput
): Promise<CopilotDirectlineSendActivityOutput> {
    const token = readNonEmptyString(payload.token);
    const conversationId = readNonEmptyString(payload.conversationId);
    const text = readNonEmptyString(payload.text);
    const userId = readNonEmptyString(payload.userId) ?? 'user';
    const history = Array.isArray(payload.history) ? payload.history : undefined;
    const cleanedHistory = history
        ? history.filter((item) => {
            if (!isRecord(item)) {
                return false;
            }
            const role = readNonEmptyString(item.role);
            const content = readNonEmptyString(item.content);
            const timestamp = readOptionalString(item.timestamp);
            return Boolean(role && content && timestamp);
        })
        : undefined;

    if (!token || !conversationId || !text) {
        throw new Error('Token, conversationId, and text are required to send an activity.');
    }

    const response = await fetch(buildActivitiesUrl(conversationId), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'message',
            from: { id: userId },
            text,
            ...(cleanedHistory && cleanedHistory.length > 0
                ? { channelData: { history: cleanedHistory } }
                : {}),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const details = errorBody ? ` - ${errorBody}` : '';
        throw new Error(
            `Direct Line send activity failed (HTTP ${response.status}): ${response.statusText}${details}`
        );
    }

    const responseBody: unknown = await response.json();

    if (!isDirectLineSendActivityResponse(responseBody)) {
        throw new Error('Unexpected response from Direct Line send activity endpoint.');
    }

    return {
        id: responseBody.id,
        timestamp: new Date().toISOString(),
    };
}
