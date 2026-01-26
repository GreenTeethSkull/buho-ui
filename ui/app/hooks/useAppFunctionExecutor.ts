import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppFunction } from "@dynatrace-sdk/react-hooks";

type AppFunctionExecutorResult<TResponse> = {
  data: TResponse | undefined;
  error: Error | undefined;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  status: string;
};

type PendingRequest<TResponse> = {
  resolve: (value: TResponse) => void;
  reject: (error: Error) => void;
};

export const useAppFunctionExecutor = <TRequest, TResponse = unknown>(
  functionName: string
) => {
  const [request, setRequest] = useState<(TRequest & { _nonce?: number }) | null>(null);
  const pendingRef = useRef<PendingRequest<TResponse> | null>(null);

  const { data, error, isError, isLoading, isSuccess, status } = useAppFunction(
    { name: functionName, data: request ?? undefined },
    { autoFetch: false, autoFetchOnUpdate: true }
  );

  const execute = useCallback((payload: TRequest) => {
    setRequest({ ...payload, _nonce: Date.now() });
  }, []);

  const executeAsync = useCallback(
    (payload: TRequest) =>
      new Promise<TResponse>((resolve, reject) => {
        const nonce = Date.now();
        pendingRef.current = { resolve, reject };
        setRequest({ ...payload, _nonce: nonce });
      }),
    []
  );

  useEffect(() => {
    if (!pendingRef.current) {
      return;
    }

    if (isSuccess) {
      pendingRef.current.resolve(data as TResponse);
      pendingRef.current = null;
      return;
    }

    if (isError) {
      const resolvedError = error ?? new Error("Unknown error");
      pendingRef.current.reject(resolvedError);
      pendingRef.current = null;
    }
  }, [data, error, isError, isSuccess]);

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
      executeAsync,
      ...result,
    }),
    [execute, executeAsync, result]
  );
};
