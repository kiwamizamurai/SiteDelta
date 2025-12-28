import type { FetchResult, FetchOptions } from "../types.js";
import {
  FetchPlaywrightNotInstalledError,
  FetchPageLoadFailedError,
  FetchWaitForSelectorTimeoutError,
  FetchTimeoutError,
  FetchNetworkError,
} from "../errors/index.js";

const DEFAULT_TIMEOUT = 30000;

async function getPlaywright() {
  try {
    const playwright = await import("playwright");
    return playwright;
  } catch {
    throw new FetchPlaywrightNotInstalledError();
  }
}

async function fetchDynamic(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const { timeout = DEFAULT_TIMEOUT, userAgent, waitFor } = options;
  const { chromium } = await getPlaywright();

  // Use custom executable path if provided via environment variable
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    const context = await browser.newContext({ userAgent: userAgent ?? undefined });
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });

    if (!response) {
      throw new FetchPageLoadFailedError(url);
    }

    if (waitFor) {
      try {
        await page.waitForSelector(waitFor, { timeout });
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          throw new FetchWaitForSelectorTimeoutError(url, waitFor, timeout);
        }
        throw error;
      }
    }

    const html = await page.content();
    const headers: Record<string, string> = {};
    const responseHeaders = response.headers();
    for (const [key, value] of Object.entries(responseHeaders)) {
      headers[key] = value;
    }

    return { html, statusCode: response.status(), headers };
  } catch (error) {
    if (
      error instanceof FetchPlaywrightNotInstalledError ||
      error instanceof FetchPageLoadFailedError ||
      error instanceof FetchWaitForSelectorTimeoutError
    ) {
      throw error;
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new FetchTimeoutError(url, timeout);
    }
    throw new FetchNetworkError(url, error instanceof Error ? error : new Error(String(error)));
  } finally {
    await browser.close();
  }
}

export async function fetchDynamicWithRetry(
  url: string,
  options: FetchOptions & { retries?: number } = {},
): Promise<FetchResult> {
  const { retries = 3, ...fetchOptions } = options;
  const maxAttempts = retries + 1;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchDynamic(url, fetchOptions);
    } catch (error) {
      if (error instanceof FetchPlaywrightNotInstalledError) {
        throw error;
      }
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
