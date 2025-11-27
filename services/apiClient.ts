export interface ApiClientOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiFetch = async <TResponse>(
  input: RequestInfo,
  init?: RequestInit,
  options: ApiClientOptions = {}
): Promise<TResponse> => {
  const { retries = 2, retryDelayMs = 500, timeoutMs = 10000 } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as TResponse;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      attempt += 1;
      if (attempt > retries) {
        break;
      }
      await sleep(retryDelayMs * attempt);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Unknown API error');
};
