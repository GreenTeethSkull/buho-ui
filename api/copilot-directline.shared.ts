export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const readNonEmptyString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};

export const readOptionalString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

export const readOptionalNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
    Array.isArray(value) && value.every(isRecord);
