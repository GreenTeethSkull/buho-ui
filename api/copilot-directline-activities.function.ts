import {
    isRecord,
    isRecordArray,
    readNonEmptyString,
    readOptionalNumber,
    readOptionalString,
} from './copilot-directline.shared';

const buildActivitiesUrl = (
    conversationId: string,
    watermark?: string,
    timeoutSeconds?: number
) => {
    const params = new URLSearchParams();

    if (watermark) {
        params.set('watermark', watermark);
    }

    if (timeoutSeconds) {
        params.set('timeout', String(timeoutSeconds));
    }

    const query = params.toString();
    return `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities${
        query ? `?${query}` : ''
    }`;
};

export interface CopilotDirectlineActivitiesInput {
    token: string;
    conversationId: string;
    watermark?: string;
    timeoutSeconds?: number;
    waitForBot?: boolean;
}

export type DirectLineActivity = Record<string, unknown>;

export interface CopilotDirectlineActivitiesOutput {
    activities: DirectLineActivity[];
    watermark?: string;
    timestamp: string;
    timedOut?: boolean;
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

const isBotActivity = (activity: DirectLineActivity): boolean => {
    if (!isRecord(activity)) {
        return false;
    }

    const type = readOptionalString(activity.type);
    if (type !== 'message') {
        return false;
    }

    if (!isRecord(activity.from)) {
        return false;
    }

    const role = readOptionalString(activity.from.role);
    return role === 'bot';
};

const isBotTurnComplete = (activity: DirectLineActivity): boolean => {
    if (!isRecord(activity)) {
        return false;
    }

    const inputHint = readOptionalString(activity.inputHint);
    return inputHint === 'acceptingInput' || inputHint === 'expectingInput';
};

export default async function (
    payload: CopilotDirectlineActivitiesInput
): Promise<CopilotDirectlineActivitiesOutput> {
    const token = readNonEmptyString(payload.token);
    const conversationId = readNonEmptyString(payload.conversationId);
    const watermark = readOptionalString(payload.watermark);
    const timeoutSecondsRaw = readOptionalNumber(payload.timeoutSeconds);
    const timeoutSeconds = timeoutSecondsRaw === undefined
        ? undefined
        : Math.max(1, Math.min(Math.floor(timeoutSecondsRaw), 55));
    const waitForBot = payload.waitForBot === true;

    if (!token || !conversationId) {
        throw new Error('Token and conversationId are required to get activities.');
    }

    const fetchActivities = async (watermarkParam?: string, timeoutParam?: number) => {
        const response = await fetch(buildActivitiesUrl(conversationId, watermarkParam, timeoutParam), {
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
        };
    };

    if (!waitForBot) {
        const responseData = await fetchActivities(watermark, timeoutSeconds);
        return {
            activities: responseData.activities,
            watermark: responseData.watermark,
            timestamp: new Date().toISOString(),
        };
    }

    const maxWaitSeconds = timeoutSeconds ?? 55;
    const maxWaitMs = maxWaitSeconds * 1000;
    const startedAt = Date.now();
    let currentWatermark = watermark;
    const botActivities: DirectLineActivity[] = [];
    const botActivityIds = new Set<string>();
    let lastBotActivityAt: number | null = null;
    const QUIET_WINDOW_MS = 2000;

    while (Date.now() - startedAt < maxWaitMs) {
        const remainingMs = maxWaitMs - (Date.now() - startedAt);
        const requestTimeoutMs = lastBotActivityAt === null
            ? remainingMs
            : Math.min(remainingMs, QUIET_WINDOW_MS);
        const requestTimeoutSeconds = Math.max(1, Math.min(55, Math.ceil(requestTimeoutMs / 1000)));

        const responseData = await fetchActivities(currentWatermark, requestTimeoutSeconds);

        if (responseData.watermark) {
            currentWatermark = responseData.watermark;
        }

        const newBotActivities = responseData.activities.filter(isBotActivity);

        if (newBotActivities.length > 0) {
            for (const activity of newBotActivities) {
                const activityId = readOptionalString(activity.id);
                if (!activityId || !botActivityIds.has(activityId)) {
                    if (activityId) {
                        botActivityIds.add(activityId);
                    }
                    botActivities.push(activity);
                }
            }

            lastBotActivityAt = Date.now();

            if (newBotActivities.some(isBotTurnComplete)) {
                return {
                    activities: botActivities,
                    watermark: currentWatermark,
                    timestamp: new Date().toISOString(),
                    timedOut: false,
                };
            }
        } else if (lastBotActivityAt !== null) {
            if (Date.now() - lastBotActivityAt >= QUIET_WINDOW_MS) {
                return {
                    activities: botActivities,
                    watermark: currentWatermark,
                    timestamp: new Date().toISOString(),
                    timedOut: false,
                };
            }
        }
    }

    return {
        activities: botActivities,
        watermark: currentWatermark,
        timestamp: new Date().toISOString(),
        timedOut: botActivities.length === 0,
    };
}
