import { settingsObjectsClient } from '@dynatrace-sdk/client-classic-environment-v2';
import { VaultClient } from '../runtime/integrations/vault.client';
import { isRecord, readNonEmptyString, readOptionalNumber, readOptionalString } from './copilot-directline.shared';

const DIRECTLINE_TOKEN_URL = 'https://directline.botframework.com/v3/directline/tokens/generate';
const COPILOT_DIRECTLINE_SCHEMA_ID = 'app:my.dynatrace.sre.toolkit:sre-toolkit-copilot-directline';

export interface CopilotDirectlineTokenInput {
    metadata?: {
        user?: string;
        [key: string]: unknown;
    };
}

export interface CopilotDirectlineTokenOutput {
    token: string;
    conversationId?: string;
    expiresIn?: number;
    timestamp: string;
}

type CopilotSettingsValue = {
    credentialId?: string;
};

type DirectLineTokenResponse = {
    token: string;
    conversationId?: string;
    expires_in?: number;
};

const isCopilotSettingsValue = (value: unknown): value is CopilotSettingsValue => isRecord(value);

const isDirectLineTokenResponse = (value: unknown): value is DirectLineTokenResponse => {
    if (!isRecord(value)) {
        return false;
    }

    const token = readNonEmptyString(value.token);
    if (!token) {
        return false;
    }

    const conversationId = readOptionalString(value.conversationId);
    if (value.conversationId !== undefined && !conversationId) {
        return false;
    }

    const expiresIn = readOptionalNumber(value.expires_in);
    if (value.expires_in !== undefined && expiresIn === undefined) {
        return false;
    }

    return true;
};

const loadCopilotSettings = async (): Promise<CopilotSettingsValue> => {
    const result = await settingsObjectsClient.getSettingsObjects({
        schemaIds: COPILOT_DIRECTLINE_SCHEMA_ID,
        fields: 'value,schemaId',
        pageSize: 1,
    });

    const selected = result.items?.[0]?.value;

    if (!selected || !isCopilotSettingsValue(selected)) {
        throw new Error('No Copilot Studio Direct Line configuration found in settings.');
    }

    return selected;
};

const resolveCredentialId = (config: CopilotSettingsValue) => {
    const credentialId = readNonEmptyString(config.credentialId) ?? '';
    if (!credentialId) {
        throw new Error('Credential ID is required for Copilot Studio Direct Line.');
    }
    return credentialId;
};

const parseInput = (payload: CopilotDirectlineTokenInput): CopilotDirectlineTokenInput => {
    const metadata = isRecord(payload.metadata) ? payload.metadata : undefined;
    const user = metadata ? readOptionalString(metadata.user) : undefined;

    if (metadata && user !== undefined) {
        return { metadata: { ...metadata, user } };
    }

    return metadata ? { metadata } : {};
};

export default async function (
    payload: CopilotDirectlineTokenInput
): Promise<CopilotDirectlineTokenOutput> {
    const { metadata } = parseInput(payload);
    const metadataUser = readNonEmptyString(metadata?.user);

    if (metadataUser) {
        console.info(`Generating Direct Line token for user: ${metadataUser}`);
    } else {
        console.info('Generating Direct Line token.');
    }

    const settings = await loadCopilotSettings();
    const credentialId = resolveCredentialId(settings);
    const directLineSecret = await VaultClient.getSecret(credentialId);

    const response = await fetch(DIRECTLINE_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${directLineSecret}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const details = errorBody ? ` - ${errorBody}` : '';
        throw new Error(
            `Direct Line token request failed (HTTP ${response.status}): ${response.statusText}${details}`
        );
    }

    const responseBody: unknown = await response.json();

    if (!isDirectLineTokenResponse(responseBody)) {
        throw new Error('Unexpected response from Direct Line token endpoint.');
    }

    return {
        token: responseBody.token,
        conversationId: responseBody.conversationId,
        expiresIn: responseBody.expires_in,
        timestamp: new Date().toISOString(),
    };
}
