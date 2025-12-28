import { fetchPage, fetchMonitorStatic, fetchMonitorDynamic } from "../fetcher/index.js";
import { extract } from "../extractor/index.js";
import { matchContent } from "../matcher/index.js";
import { detectChanges, getContentHash } from "../diff/index.js";
import { getMonitorState } from "../storage/index.js";
import { isSitePatrolError } from "../errors/index.js";
import type {
  Config,
  Monitor,
  CheckResult,
  CheckResultError,
  State,
  FetchResult,
  ExtractResult,
  NamedSelector,
  SelectorResult,
  MonitorState,
} from "../types.js";

function isExtractionEmpty(result: ExtractResult): boolean {
  return !result.content || result.content.trim() === "";
}

async function isPlaywrightAvailable(): Promise<boolean> {
  try {
    await import("playwright");
    return true;
  } catch {
    return false;
  }
}


function processSelectors(
  html: string,
  selectors: NamedSelector[],
  previousState?: MonitorState,
): { selectorResults: SelectorResult[]; combinedHash: string } {
  const results: SelectorResult[] = [];

  for (const selector of selectors) {
    const extractResult = extract(html, selector);
    const hash = getContentHash(extractResult.content);

    let matchedValue: string | undefined;
    if (selector.match) {
      const matchResult = matchContent(extractResult.content, selector.match);
      matchedValue = matchResult.value;
    }

    const prevSelectorState = previousState?.selectors?.[selector.name];
    const prevHash = prevSelectorState?.hash;
    const prevMatchedValue = prevSelectorState?.matchedValue;

    const hasChanged = prevHash !== undefined && prevHash !== hash;

    results.push({
      name: selector.name,
      status: hasChanged ? "changed" : "unchanged",
      hash,
      previousHash: prevHash,
      content: extractResult.content,
      matchedValue,
      previousMatchedValue: prevMatchedValue,
      diff: hasChanged ? detectChanges(prevMatchedValue ?? "", matchedValue ?? "") ?? undefined : undefined,
    });
  }

  // Combined hash from all selector contents
  const combinedContent = results.map((r) => `${r.name}:${r.content}`).join("\n---\n");
  const combinedHash = getContentHash(combinedContent);

  return { selectorResults: results, combinedHash };
}

export async function checkMonitor(
  monitor: Monitor,
  state: State,
  defaults?: Config["defaults"],
): Promise<CheckResult> {
  const timestamp = new Date().toISOString();
  const previousState = getMonitorState(state, monitor.id);

  try {
    let fetchResult: FetchResult;

    if (monitor.mode) {
      console.log(`  Fetching ${monitor.url} (${monitor.mode})...`);
      fetchResult = await fetchPage(monitor, defaults);
    } else {
      console.log(`  Fetching ${monitor.url} (static)...`);
      fetchResult = await fetchMonitorStatic(monitor, defaults);

      // Check if first selector extraction is empty
      const firstExtract = extract(fetchResult.html, monitor.selectors[0]);
      if (isExtractionEmpty(firstExtract) && (await isPlaywrightAvailable())) {
        console.log(`  Empty result, retrying with dynamic mode...`);
        fetchResult = await fetchMonitorDynamic(monitor, defaults);
      }
    }

    const { selectorResults, combinedHash } = processSelectors(
      fetchResult.html,
      monitor.selectors,
      previousState,
    );

    const changedSelectors = selectorResults
      .filter((r) => r.status === "changed")
      .map((r) => r.name);

    const hasAnyChanged = changedSelectors.length > 0;

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      timestamp,
      status: hasAnyChanged ? "changed" : "unchanged",
      currentHash: combinedHash,
      previousHash: previousState?.hash,
      selectorResults,
      changedSelectors,
    };
  } catch (error) {
    let errorDetails: CheckResultError | undefined;
    let errorMessage: string;

    if (isSitePatrolError(error)) {
      errorMessage = error.message;
      errorDetails = {
        code: error.code,
        stage: error.stage,
        message: error.message,
        suggestion: error.suggestion,
        context: error.context,
      };
    } else {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      timestamp,
      status: "error",
      currentHash: "",
      error: errorMessage,
      errorDetails,
    };
  }
}
