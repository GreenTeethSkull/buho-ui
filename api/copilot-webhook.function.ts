import { readNonEmptyString, readOptionalString } from './copilot-directline.shared';

const WEBHOOK_URL =
    'https://c33d836546e2e3fdad9083dfdfe350.e7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f2a03ed13dbd47faaaab1f932c536a1c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M9YRgYQC4yCLaYa0CITez275FioWw7BCVgUL0XIsWZ0';

export interface CopilotWebhookInput {
    text: string;
    copilotConversationId?: string;
}

export interface CopilotWebhookOutput {
    responses: string[];
    conversationId: string;
}

export default async function (payload: CopilotWebhookInput): Promise<CopilotWebhookOutput> {
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

    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Webhook request failed (HTTP ${response.status}): ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
        );
    }

    const responseBody = (await response.json()) as { responses?: unknown; conversationId?: unknown };

    const responses = Array.isArray(responseBody.responses)
        ? (responseBody.responses as unknown[]).filter((r): r is string => typeof r === 'string')
        : [];

    const conversationId = readOptionalString(responseBody.conversationId);
    if (!conversationId) {
        throw new Error('No conversationId returned from webhook.');
    }

    return { responses, conversationId };
}