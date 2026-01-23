import { useState, useCallback } from "react";

const HARDCODED_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Il9aNGdIZFFoT0Y2Xy1TM2tqUjdVUDgtOG4zRSIsIng1dCI6Il9aNGdIZFFoT0Y2Xy1TM2tqUjdVUDgtOG4zRSIsInR5cCI6IkpXVCJ9.eyJib3QiOiI4ODEyMDE4Ni0yMDdhLWIwNTktMWJjMC1mMjUxZjhjOGQzMmIiLCJzaXRlIjoiQzRsZWRvYTlWTjlNVm5jT2pQaFo2QlV4RndwbUhUaHQ2UUJKR1I1ZGNXdWh2N0k4TTg2R0pRUUo5OUNBQUNZZUJqRkFBcm9oQUFBQkFaQlMyUnJKIiwiY29udiI6IkxMcldsVDlKMmY5Q252RVF0RE1PMHAtdXMiLCJqdGkiOiI4REU1QTkwQjJCOEVBRDUtYzgxMjZlMjgzMWU1NGIyM2I5NTg5YTNiMjdmNDUzMmYiLCJuYmYiOjE3NjkxODA2NjUsImV4cCI6MTc2OTE4NDI2NSwiaXNzIjoiaHR0cHM6Ly9kaXJlY3RsaW5lLmJvdGZyYW1ld29yay5jb20vIiwiYXVkIjoiaHR0cHM6Ly9kaXJlY3RsaW5lLmJvdGZyYW1ld29yay5jb20vIn0.pEbaUnZNAIRxvhn0LPnJNUfnXuHlgf20AwjXVDspNUXQBFbMHdCyYgzFwklHpxs6eeBUILoyAL2dRyXhUnPB_ILWRcoM9bL8aKVkpjj98T7CtlyhznYg77xoTsUqAq0UDfakkYzEmd7IzsYerBS0YQOOgb76btwLptfPHmgtiCqDemkO3sftNbnGtW_h5R7HdQrpKFmlzE9CzBqc23gA7ZDRsl92T6t60RvMjD5x1_3o7pe-Af_6oqZGvNBgCOu0duxByXgEkvkswqYdMG2qh-DxybOs98gZIbDp8GDMDO2-1-0ueoOuLu0hTgD5kOGBAlIcqCLqccv0F6bs9bPRQQ";

export const useDirectLineToken = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchToken = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // TODO: Reemplazar con llamada real usando useAppFunctionExecutor
            // const { execute } = useAppFunctionExecutor<void, { token: string }>("get-directline-token");
            // const result = await execute({});
            setToken(HARDCODED_TOKEN);
            return HARDCODED_TOKEN;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { token, fetchToken, isLoading, error };
};