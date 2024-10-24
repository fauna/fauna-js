export type RetryOptions = {
  maxAttempts: number;
  maxBackoff: number;
  shouldRetry?: (error: any) => boolean;
  attempt?: number;
  sleepFn?: (callback: (args: void) => void, ms?: number) => void;
};

export const withRetries = async <T>(
  fn: () => Promise<T>,
  {
    maxAttempts,
    maxBackoff,
    shouldRetry = () => true,
    attempt = 0,
    sleepFn = setTimeout,
  }: RetryOptions,
): Promise<T> => {
  const backoffMs =
    attempt > 0
      ? Math.min(Math.random() * 2 ** attempt, maxBackoff) * 1_000
      : 0;
  attempt += 1;

  try {
    return await fn();
  } catch (error: any) {
    if (attempt >= maxAttempts || shouldRetry(error) !== true) {
      throw error;
    }

    await new Promise((resolve) => sleepFn(resolve, backoffMs));
    return withRetries(fn, {
      maxAttempts,
      maxBackoff,
      shouldRetry,
      attempt,
      sleepFn,
    });
  }
};
