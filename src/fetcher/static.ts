import type { FetchResult, FetchOptions } from "../types.js";
import { FetchTimeoutError, FetchHttpError, FetchNetworkError } from "../errors/index.js";

const DEFAULT_USER_AGENT = "SitePatrol/1.0";
const DEFAULT_TIMEOUT = 30000;

async function fetchStatic(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const { timeout = DEFAULT_TIMEOUT, userAgent = DEFAULT_USER_AGENT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new FetchHttpError(url, response.status, response.statusText);
    }

    const html = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { html, statusCode: response.status, headers };
  } catch (error) {
    if (error instanceof FetchHttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError(url, timeout);
    }
    throw new FetchNetworkError(url, error instanceof Error ? error : new Error(String(error)));
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchStaticWithRetry(
  url: string,
  options: FetchOptions & { retries?: number } = {},
): Promise<FetchResult> {
  const { retries = 3, ...fetchOptions } = options;
  const maxAttempts = retries + 1;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchStatic(url, fetchOptions);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError && "context" in lastError) {
    const err = lastError as { context: Record<string, unknown> };
    err.context.attempt = maxAttempts;
    err.context.maxAttempts = maxAttempts;
  }

  throw lastError ?? new FetchNetworkError(url, new Error("Failed to fetch after retries"), maxAttempts, maxAttempts);
}
