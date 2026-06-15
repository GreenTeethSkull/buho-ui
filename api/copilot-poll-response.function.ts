import { stateClient } from '@dynatrace-sdk/client-state';
import { readNonEmptyString, readOptionalString } from './copilot-directline.shared';

const MAX_POLL_DURATION_MS = 55_000;
const APP_STATE_KEY_PREFIX = 'send-';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface SendMetadata {
    locationUrl: string;
    retryAfter: number;
    createdAt: number;
}

export interface CopilotPollResponseInput {
    trackingId: string;
}

export type CopilotPollResponseOutput =
    | {
          status: 'completed';
          conversationId: string;
          response: string;
      }
    | {
          status: 'running';
          trackingId: string;
      };

export default async function (payload: CopilotPollResponseInput): Promise<CopilotPollResponseOutput> {
    const trackingId = readNonEmptyString(payload.trackingId);

    if (!trackingId) {
        throw new Error('trackingId is required.');
    }

    const appState = await stateClient.getAppState({
        key: `${APP_STATE_KEY_PREFIX}${trackingId}`,
    });

    if (!appState.value) {
        throw new Error(`No poll metadata found for trackingId: ${trackingId}`);
    }

    const metadata = JSON.parse(appState.value) as SendMetadata;
    const { locationUrl, retryAfter } = metadata;
    const pollIntervalMs = (retryAfter && retryAfter > 0 ? retryAfter : 10) * 1000;
    const startedAt = Date.now();

    while (true) {
        const response = await fetch(locationUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Poll response request failed (HTTP ${response.status}): ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
            );
        }

        const responseBody = (await response.json()) as Record<string, unknown>;

        if (response.status === 200) {
            const conversationId = readOptionalString(responseBody.conversationId) ?? '';
            const responseText = readOptionalString(responseBody.response) ?? '';

            return {
                status: 'completed',
                conversationId,
                response: responseText,
            };
        }

        if (response.status === 202) {
            if (Date.now() - startedAt >= MAX_POLL_DURATION_MS) {
                return {
                    status: 'running',
                    trackingId,
                };
            }

            await delay(pollIntervalMs);
            continue;
        }

        throw new Error(`Unexpected poll response status: ${response.status}`);
    }
}
