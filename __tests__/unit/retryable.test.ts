import { withRetries } from "../../src/util/retryable";

describe("retryable", () => {
  it("should retry", async () => {
    const fn = jest
      .fn()
      .mockImplementation(() => {
        return true;
      })
      .mockImplementationOnce(() => {
        throw new Error("error");
      });
    const res = await withRetries(fn, { maxAttempts: 3, maxBackoff: 2 });

    expect(res).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw the last error if attempts are greater than or equal to maxAttempts", async () => {
    const fn = jest.fn().mockImplementation(() => {
      throw new Error("error");
    });

    await expect(
      withRetries(fn, { maxAttempts: 3, maxBackoff: 2 }),
    ).rejects.toThrow("error");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should not retry if shouldRetry returns false", async () => {
    const fn = jest.fn().mockImplementation(() => {
      throw new Error("error");
    });
    const shouldRetry = jest
      .fn()
      .mockImplementation(() => false)
      .mockImplementationOnce(() => true);

    await expect(
      withRetries(fn, { maxAttempts: 3, maxBackoff: 2, shouldRetry }),
    ).rejects.toThrow("error");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(shouldRetry).toHaveBeenCalledTimes(2);
  });

  it("should backoff", async () => {
    const fn = jest.fn().mockImplementation(() => {
      throw new Error("max attempts reached");
    });

    const mockSleep = jest.fn().mockImplementation((fn) => {
      fn();
    });

    await expect(
      withRetries(fn, { maxAttempts: 3, maxBackoff: 2, sleepFn: mockSleep }),
    ).rejects.toThrow("max attempts reached");

    expect(mockSleep).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenNthCalledWith(1, expect.any(Function), 0); // first attempt
    expect(mockSleep).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.any(Number),
    ); // second attempt
    expect(mockSleep.mock.calls[1][1]).toBeGreaterThan(0); // second attempt is greater than 0
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
