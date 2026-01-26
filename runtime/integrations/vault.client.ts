import {
    credentialVaultClient,
    isApiGatewayError,
    isClientRequestError,
} from '@dynatrace-sdk/client-classic-environment-v2';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const safeJsonStringify = (value: unknown) => {
    try {
        return JSON.stringify(value);
    } catch {
        return undefined;
    }
};

const formatVaultError = (err: unknown) => {
    if (isApiGatewayError(err)) {
        const errorBody = err.body?.error;
        const details = errorBody?.details;
        const parts = [
            `status=${err.code}`,
            errorBody?.message ? `message=${errorBody.message}` : undefined,
            details?.errorCode ? `errorCode=${details.errorCode}` : undefined,
            details?.missingScopes?.length
                ? `missingScopes=${details.missingScopes.join(',')}`
                : undefined,
            details?.missingPermissions?.length
                ? `missingPermissions=${details.missingPermissions.join(',')}`
                : undefined,
            details?.errorRef ? `errorRef=${details.errorRef}` : undefined,
            details?.traceId ? `traceId=${details.traceId}` : undefined,
        ].filter(Boolean);
        return parts.join(' ');
    }

    if (isClientRequestError(err)) {
        const status = err.response?.status;
        const body = safeJsonStringify(err.body);
        const parts = [
            status ? `status=${status}` : undefined,
            body ? `body=${body}` : undefined,
        ].filter(Boolean);
        return parts.join(' ') || 'Unexpected error.';
    }

    if (err instanceof Error) {
        return err.message;
    }

    return 'Unexpected error.';
};

/**
 * Service to interact with the Dynatrace Credential Vault.
 */
export class VaultClient {
    /**
     * lists credentials from the vault.
     * @param type The type of credential to list (default: TOKEN).
     * @param scope The usage scope (default: APP_ENGINE).
     * @returns A list of credentials metadata (no secrets).
     */
    static async listSecrets(
        type:
            | 'CERTIFICATE'
            | 'USERNAME_PASSWORD'
            | 'TOKEN'
            | 'SNMPV3'
            | 'AWS_MONITORING_KEY_BASED'
            | 'AWS_MONITORING_ROLE_BASED' = 'TOKEN',
        scope = 'APP_ENGINE'
    ) {
        return credentialVaultClient.listCredentials({ type, scope });
    }

    /**
     * Retrieves a secret token by ID.
     * Intended for use in Backend contexts (Actions, App Functions).
     * @param credentialId The ID of the credential.
     * @returns The secret value.
     * @throws Error if not found or empty.
     */
    static async getSecret(credentialId: string): Promise<string> {
        const normalizedId = credentialId.trim();
        if (!normalizedId) {
            throw new Error('Credential ID requerido.');
        }

        let credential: unknown;
        try {
            credential = await credentialVaultClient.getCredentialsDetails({ id: normalizedId });
        } catch (err) {
            const message = formatVaultError(err);
            throw new Error(`Credential lookup failed for id ${normalizedId}: ${message}`);
        }

        if (!credential) {
            throw new Error(`Credential with ID ${normalizedId} not found.`);
        }

        const details = isRecord(credential) ? credential : {};
        const password = typeof details.password === 'string' ? details.password : '';
        const tokenValue = typeof details.token === 'string' ? details.token : '';
        const token = password || tokenValue;

        if (!token) {
            throw new Error(`Credential ${normalizedId} has no secret value.`);
        }

        return token;
    }
}
