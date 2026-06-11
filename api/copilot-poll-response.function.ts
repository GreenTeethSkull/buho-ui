import { readNonEmptyString, readOptionalString } from './copilot-directline.shared';

// const POLL_RESPONSE_URL =
//     'https://c33d836546e2e3fdad9083dfdfe350.e7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/40d345033a50417a8b7fdfcd1883fcd3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Bw52ZVHWQRu09pDe5MxyU29b95G5lD0jei7bf1G3ykI';

const POLL_RESPONSE_URL =
    'https://87129083fbbee240961042521504ad.e6.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/04013af21fe74309ac3a0c72ed9d2107/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oNuAh3mXnC4QXjrL0LnZoCz4KWOUG8zsk1-Bp7RhGmI';

export interface CopilotPollResponseInput {
    rowId: string;
}

export interface CopilotPollResponseOutput {
    executionId: string;
    conversationId: string;
    status: string;
    response: string;
}

export default async function (payload: CopilotPollResponseInput): Promise<CopilotPollResponseOutput> {
    const rowId = readNonEmptyString(payload.rowId);

    if (!rowId) {
        throw new Error('rowId is required.');
    }

    const response = await fetch(POLL_RESPONSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Poll response request failed (HTTP ${response.status}): ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
        );
    }

    const responseBody = (await response.json()) as Record<string, unknown>;

    const executionId = readOptionalString(responseBody.executionId) ?? '';
    const conversationId = readOptionalString(responseBody.conversationId) ?? '';
    const status = readOptionalString(responseBody.status) ?? '';
    const responseText = readOptionalString(responseBody.response) ?? '';

    return {
        executionId,
        conversationId,
        status,
        response: responseText,
    };
}
