import { useCallback, useState } from 'react';

import type { ApiClientError } from '@/lib/api/client';

export type ApiMutationOptions<TInput, TOutput> = {
  onSuccess?: (data: TOutput, variables: TInput) => void | Promise<void>;
  onError?: (error: ApiClientError, variables: TInput) => void | Promise<void>;
};

export type ApiMutationResult<TInput, TOutput> = {
  mutate: (variables: TInput) => Promise<TOutput>;
  loading: boolean;
  error: ApiClientError | null;
  reset: () => void;
};

export function useApiMutation<TInput, TOutput>(
  mutation: (variables: TInput) => Promise<TOutput>,
  options: ApiMutationOptions<TInput, TOutput> = {}
): ApiMutationResult<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (variables: TInput) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutation(variables);
        await onSuccess?.(result, variables);
        setLoading(false);
        return result;
      } catch (caught) {
        const apiError = caught as ApiClientError;
        setError(apiError);
        await onError?.(apiError, variables);
        setLoading(false);
        throw apiError;
      }
    },
    [mutation, onError, onSuccess]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}
