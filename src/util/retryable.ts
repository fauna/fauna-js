export type RetryOptions = {
  maxAttempts: number;
  maxBackoff: number;
  shouldRetry?: (error: any) => boolean;
  attempt?: number;
};

export const withRetries = async <T>(
  fn: () => Promise<T>,
  {
    maxAttempts,
    maxBackoff,
    shouldRetry = () => true,
    attempt = 0,
  }: RetryOptions,
): Promise<T> => {
  const backoffMs = Math.min(Math.random() * 2 ** attempt, maxBackoff) * 1_000;
  attempt += 1;

  try {
    return await fn();
  } catch (error: any) {
    if (attempt >= maxAttempts || shouldRetry(error) !== true) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return withRetries(fn, { maxAttempts, maxBackoff, shouldRetry, attempt });
  }
};
