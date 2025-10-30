import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ApiClientError } from '@/lib/api/client';

export type ApiQueryOptions<TData = unknown> = {
  enabled?: boolean;
  immediate?: boolean;
  initialData?: TData;
};

export type ApiQueryResult<TData> = {
  data: TData | undefined;
  loading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<TData>;
  lastUpdatedAt: number | null;
};

export function useApiQuery<TData>(
  queryKey: unknown,
  queryFn: () => Promise<TData>,
  options: ApiQueryOptions<TData> = {}
): ApiQueryResult<TData> {
  const enabled = options.enabled ?? true;
  const shouldLoadImmediately = options.immediate ?? true;

  const [data, setData] = useState<TData | undefined>(options.initialData);
  const [loading, setLoading] = useState<boolean>(enabled && shouldLoadImmediately && !options.initialData);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const cacheKey = useMemo(() => JSON.stringify(queryKey ?? 'default'), [queryKey]);

  const execute = useCallback(async () => {
    if (!enabled) {
      return Promise.reject(new Error('Query is disabled'));
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setLastUpdatedAt(Date.now());
      setLoading(false);
      return result;
    } catch (caught) {
      const apiError = caught as ApiClientError;
      setError(apiError);
      setLoading(false);
      throw apiError;
    }
  }, [enabled, queryFn]);

  useEffect(() => {
    if (!enabled || !shouldLoadImmediately) {
      return;
    }

    void execute();
  }, [cacheKey, enabled, execute, shouldLoadImmediately]);

  const refetch = useCallback(() => execute(), [execute]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdatedAt,
  };
}
