import { readNonEmptyString, readOptionalString } from './copilot-directline.shared';

// const SEND_MESSAGE_URL =
//     'https://c33d836546e2e3fdad9083dfdfe350.e7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f9e5dc0b7f14cfe9b194bc00e42d7ab/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9T4IuB01NnbnSnszv4v9GVx9qQ80tOS4KKeAtV8wctk';

const SEND_MESSAGE_URL =
    'https://87129083fbbee240961042521504ad.e6.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9a04a913fde848c1af870be5e6c13c1f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Vu_cLtIAcwzzAay01_kYie0kairxqgZZUMFdcLfR-Wg';

export interface CopilotSendMessageInput {
    text: string;
    copilotConversationId?: string;
}

export interface CopilotSendMessageOutput {
    status: string;
    executionId: string;
    rowId: string;
    message: string;
    receivedAt: string;
    channelId: string;
}

export default async function (payload: CopilotSendMessageInput): Promise<CopilotSendMessageOutput> {
    const text = readNonEmptyString(payload.text);
    const copilotConversationId = readOptionalString(payload.copilotConversationId);

    if (!text) {
        throw new Error('text is required.');
    }

    const body: Record<string, unknown> = {
        schema_version: '1.1',
        channel_id: 'dynatrace',
        source: {
            transport: 'webhook',
            mode: 'normal',
            output_format: 'normal',
            direct_line_enabled: false,
            response_schema_provided: false,
        },
        message: {
            type: 'text',
            text,
        },
        context: {
            mode: 'normal',
            output_format: 'normal',
        },
    };

    if (copilotConversationId) {
        body.timestamp = new Date().toISOString();
        body.conversation = {
            id: copilotConversationId,
            type: 'direct',
        };
    }

    const response = await fetch(SEND_MESSAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Send message request failed (HTTP ${response.status}): ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
        );
    }

    const responseBody = (await response.json()) as Record<string, unknown>;

    const status = readOptionalString(responseBody.status);
    const executionId = readOptionalString(responseBody.executionId);
    const rowId = readOptionalString(responseBody.rowId);
    const message = readOptionalString(responseBody.message);
    const receivedAt = readOptionalString(responseBody.received_at);
    const channelId = readOptionalString(responseBody.channel_id);

    if (!rowId) {
        throw new Error('No rowId returned from send message endpoint.');
    }

    return {
        status: status ?? '',
        executionId: executionId ?? '',
        rowId,
        message: message ?? '',
        receivedAt: receivedAt ?? '',
        channelId: channelId ?? '',
    };
}
