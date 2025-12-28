import type { FetchResult, FetchOptions, Monitor } from "../types.js";
import { fetchStaticWithRetry } from "./static.js";
import { fetchDynamicWithRetry } from "./dynamic.js";

function getWaitForSelector(monitor: Monitor): string | undefined {
  if (monitor.waitFor) {
    return monitor.waitFor;
  }
  // Use first CSS selector for waitFor
  const cssSelector = monitor.selectors.find((s) => s.type === "css" && s.value);
  if (cssSelector) {
    return cssSelector.value;
  }
  return undefined;
}

export async function fetchMonitorStatic(
  monitor: Monitor,
  defaults?: { timeout?: number; userAgent?: string },
): Promise<FetchResult> {
  const options: FetchOptions & { retries?: number } = {
    timeout: monitor.timeout ?? defaults?.timeout ?? 30000,
    userAgent: defaults?.userAgent ?? "SitePatrol/1.0",
    retries: monitor.retries ?? 3,
  };
  return fetchStaticWithRetry(monitor.url, options);
}

export async function fetchMonitorDynamic(
  monitor: Monitor,
  defaults?: { timeout?: number; userAgent?: string },
): Promise<FetchResult> {
  const options: FetchOptions & { retries?: number } = {
    timeout: monitor.timeout ?? defaults?.timeout ?? 30000,
    userAgent: defaults?.userAgent ?? "SitePatrol/1.0",
    waitFor: getWaitForSelector(monitor),
    retries: monitor.retries ?? 3,
  };
  return fetchDynamicWithRetry(monitor.url, options);
}

export async function fetchPage(
  monitor: Monitor,
  defaults?: { timeout?: number; userAgent?: string },
): Promise<FetchResult> {
  if (monitor.mode === "dynamic") {
    return fetchMonitorDynamic(monitor, defaults);
  }
  return fetchMonitorStatic(monitor, defaults);
}
