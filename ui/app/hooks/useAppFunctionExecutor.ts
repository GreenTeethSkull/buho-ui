import { useCallback, useMemo, useState } from "react";
import { useAppFunction } from "@dynatrace-sdk/react-hooks";

type AppFunctionExecutorResult<TResponse> = {
  data: TResponse | undefined;
  error: Error | undefined;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  status: string;
};

export const useAppFunctionExecutor = <TRequest, TResponse = unknown>(
  functionName: string
) => {
  const [request, setRequest] = useState<(TRequest & { _nonce?: number }) | null>(null);

  const { data, error, isError, isLoading, isSuccess, status } = useAppFunction(
    { name: functionName, data: request ?? undefined },
    { autoFetch: false, autoFetchOnUpdate: true }
  );

  const execute = useCallback((payload: TRequest) => {
    setRequest({ ...payload, _nonce: Date.now() });
  }, []);

  const result = useMemo<AppFunctionExecutorResult<TResponse>>(
    () => ({
      data: data as TResponse | undefined,
      error: error ?? undefined,
      isError,
      isLoading,
      isSuccess,
      status,
    }),
    [data, error, isError, isLoading, isSuccess, status]
  );

  return useMemo(
    () => ({
      execute,
      ...result,
    }),
    [execute, result]
  );
};
