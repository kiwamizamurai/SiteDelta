import { SitePatrolError } from "./base.js";
import { ErrorCode, ErrorStage } from "./codes.js";

export class FetchNetworkError extends SitePatrolError {
  constructor(url: string, cause: Error, attempt?: number, maxAttempts?: number) {
    const attemptInfo = attempt !== undefined ? ` (attempt ${attempt}/${maxAttempts})` : "";
    super({
      code: ErrorCode.FETCH_NETWORK_ERROR,
      stage: ErrorStage.FETCH,
      message: `Network error${attemptInfo}: ${url}`,
      suggestion:
        "Check if URL is correct and accessible. Verify network connectivity. Site may be blocking requests.",
      context: { url, attempt, maxAttempts },
      cause,
    });
    this.name = "FetchNetworkError";
  }
}

export class FetchTimeoutError extends SitePatrolError {
  constructor(url: string, timeoutMs: number, attempt?: number, maxAttempts?: number) {
    const attemptInfo = attempt !== undefined ? ` (attempt ${attempt}/${maxAttempts})` : "";
    super({
      code: ErrorCode.FETCH_TIMEOUT,
      stage: ErrorStage.FETCH,
      message: `Request timed out after ${timeoutMs}ms${attemptInfo}: ${url}`,
      suggestion: `Increase timeout value in config (current: ${timeoutMs}ms). Site may be slow or unresponsive.`,
      context: { url, timeoutMs, attempt, maxAttempts },
    });
    this.name = "FetchTimeoutError";
  }
}

export class FetchHttpError extends SitePatrolError {
  constructor(url: string, statusCode: number, statusText: string) {
    const suggestions: Record<number, string> = {
      400: "Check if the URL is correctly formed.",
      401: "Page requires authentication. Add credentials or use a public URL.",
      403: "Access denied. Try adding a custom User-Agent in config defaults.",
      404: "Page not found. Verify the URL is correct and page still exists.",
      429: "Too many requests. Reduce monitoring frequency.",
      500: "Server error. The site may be experiencing issues.",
      502: "Bad gateway. Site's server may be down.",
      503: "Service unavailable. Site may be under maintenance.",
    };

    super({
      code: ErrorCode.FETCH_HTTP_ERROR,
      stage: ErrorStage.FETCH,
      message: `HTTP ${statusCode} (${statusText}): ${url}`,
      suggestion: suggestions[statusCode] ?? `HTTP ${statusCode} error. Check if URL is accessible in browser.`,
      context: { url, httpStatus: statusCode },
    });
    this.name = "FetchHttpError";
  }
}

export class FetchPageLoadFailedError extends SitePatrolError {
  constructor(url: string, cause?: Error) {
    super({
      code: ErrorCode.FETCH_PAGE_LOAD_FAILED,
      stage: ErrorStage.FETCH,
      message: `Failed to load page: ${url}`,
      suggestion: "Page failed to load in browser. Check URL and try again.",
      context: { url },
      cause,
    });
    this.name = "FetchPageLoadFailedError";
  }
}

export class FetchPlaywrightNotInstalledError extends SitePatrolError {
  constructor(monitorId?: string) {
    super({
      code: ErrorCode.FETCH_PLAYWRIGHT_NOT_INSTALLED,
      stage: ErrorStage.FETCH,
      message: "Playwright is required but not installed",
      suggestion:
        "Add 'install-playwright: true' to workflow inputs, or run 'npm install playwright && npx playwright install chromium'.",
      context: { monitorId },
    });
    this.name = "FetchPlaywrightNotInstalledError";
  }
}

export class FetchWaitForSelectorTimeoutError extends SitePatrolError {
  constructor(url: string, selector: string, timeoutMs: number) {
    super({
      code: ErrorCode.FETCH_WAIT_FOR_SELECTOR_TIMEOUT,
      stage: ErrorStage.FETCH,
      message: `Timeout waiting for selector '${selector}' on ${url}`,
      suggestion: "Selector may not exist or takes too long to appear. Verify in browser DevTools.",
      context: { url, selector, timeoutMs },
    });
    this.name = "FetchWaitForSelectorTimeoutError";
  }
}
