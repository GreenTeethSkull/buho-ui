import { stateClient } from '@dynatrace-sdk/client-state';
import { readNonEmptyString, readOptionalString } from './copilot-directline.shared';

const SEND_MESSAGE_URL =
    'https://87129083fbbee240961042521504ad.e6.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1afcd7a65f7640c3ad2fd3560e34c9ad/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HpZ-rDF0vU2tgX2aJ--5JBDeB6LbVXJXGaCHUxka_zU';

const APP_STATE_KEY_PREFIX = 'send-';
const APP_STATE_TTL = 'now+30m';

export interface CopilotSendMessageInput {
    text: string;
    copilotConversationId?: string;
}

export interface CopilotSendMessageOutput {
    trackingId: string;
    retryAfter: number;
}

interface SendMetadata {
    locationUrl: string;
    retryAfter: number;
    createdAt: number;
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

    const locationUrl = response.headers.get('location') ?? '';
    const trackingId = response.headers.get('x-ms-tracking-id') ?? '';
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 10;

    if (!locationUrl) {
        throw new Error('No Location header returned from send message endpoint.');
    }

    const metadata: SendMetadata = {
        locationUrl,
        retryAfter,
        createdAt: Date.now(),
    };

    await stateClient.setAppState({
        key: `${APP_STATE_KEY_PREFIX}${trackingId}`,
        body: {
            value: JSON.stringify(metadata),
            validUntilTime: APP_STATE_TTL,
        },
    });

    return {
        trackingId,
        retryAfter,
    };
}
