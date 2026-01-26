import { isRecord, isRecordArray, readNonEmptyString, readOptionalString } from './copilot-directline.shared';

const buildActivitiesUrl = (conversationId: string, watermark?: string) => {
    const encodedWatermark = watermark ? `?watermark=${encodeURIComponent(watermark)}` : '';
    return `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities${encodedWatermark}`;
};

export interface CopilotDirectlineActivitiesInput {
    token: string;
    conversationId: string;
    watermark?: string;
}

export type DirectLineActivity = Record<string, unknown>;

export interface CopilotDirectlineActivitiesOutput {
    activities: DirectLineActivity[];
    watermark?: string;
    timestamp: string;
}

type DirectLineActivitiesResponse = {
    activities?: unknown;
    watermark?: string;
};

const isDirectLineActivitiesResponse = (value: unknown): value is DirectLineActivitiesResponse => {
    if (!isRecord(value)) {
        return false;
    }

    if (value.activities !== undefined && !isRecordArray(value.activities)) {
        return false;
    }

    const watermark = readOptionalString(value.watermark);
    if (value.watermark !== undefined && watermark === undefined) {
        return false;
    }

    return true;
};

export default async function (
    payload: CopilotDirectlineActivitiesInput
): Promise<CopilotDirectlineActivitiesOutput> {
    const token = readNonEmptyString(payload.token);
    const conversationId = readNonEmptyString(payload.conversationId);
    const watermark = readOptionalString(payload.watermark);

    if (!token || !conversationId) {
        throw new Error('Token and conversationId are required to get activities.');
    }

    const response = await fetch(buildActivitiesUrl(conversationId, watermark), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const details = errorBody ? ` - ${errorBody}` : '';
        throw new Error(
            `Direct Line get activities failed (HTTP ${response.status}): ${response.statusText}${details}`
        );
    }

    const responseBody: unknown = await response.json();

    if (!isDirectLineActivitiesResponse(responseBody)) {
        throw new Error('Unexpected response from Direct Line activities endpoint.');
    }

    const activities = responseBody.activities ?? [];

    return {
        activities: isRecordArray(activities) ? activities : [],
        watermark: responseBody.watermark,
        timestamp: new Date().toISOString(),
    };
}
