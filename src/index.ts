import { resolve, basename } from "node:path";
import { appendFile } from "node:fs/promises";
import { loadConfig } from "./config/index.js";
import { checkMonitor } from "./application/index.js";
import {
  loadState,
  saveState,
  getMonitorState,
  updateMonitorState,
  appendToCsv,
} from "./storage/index.js";
import { isSitePatrolError, formatForConsole } from "./errors/index.js";
import type { CheckResult, SelectorState, Config, ConfigResult, RunOutput } from "./types.js";

interface OutputPaths {
  statePath: string;
  csvPath: string;
}

function deriveOutputPaths(configPath: string, config: Config): OutputPaths {
  const configName = basename(configPath, ".yaml");
  return {
    statePath: config.output?.state?.path ?? `./data/${configName}-state.json`,
    csvPath: config.output?.csv?.path ?? `./data/${configName}-history.csv`,
  };
}

async function runSingleConfig(configPath: string): Promise<ConfigResult> {
  const configName = basename(configPath, ".yaml");
  console.log(`\n=== [${configName}] ===`);
  console.log(`Loading config from ${configPath}...`);

  const config = await loadConfig(configPath);
  const { statePath, csvPath } = deriveOutputPaths(configPath, config);

  console.log(`Loading state from ${statePath}...`);
  let state = await loadState(statePath);

  const results: CheckResult[] = [];

  console.log(`Checking ${config.monitors.length} monitor(s)...\n`);

  for (const monitor of config.monitors) {
    console.log(`[${monitor.id}] ${monitor.name}`);

    const result = await checkMonitor(monitor, state, config.defaults);
    results.push(result);

    if (result.status !== "error" && result.selectorResults) {
      const selectorStates = result.selectorResults.reduce(
        (acc, sr) => ({
          ...acc,
          [sr.name]: { hash: sr.hash, matchedValue: sr.matchedValue },
        }),
        {} as Record<string, SelectorState>,
      );

      state = updateMonitorState(state, monitor.id, {
        hash: result.currentHash,
        lastChecked: result.timestamp,
        lastChanged:
          result.status === "changed"
            ? result.timestamp
            : getMonitorState(state, monitor.id)?.lastChanged,
        selectors: selectorStates,
      });
    }

    const statusIcon = result.status === "changed" ? "!" : result.status === "error" ? "x" : "-";
    console.log(`  [${statusIcon}] ${result.status}`);
    if (result.errorDetails) {
      console.log(`  [${result.errorDetails.code}] ${result.errorDetails.message}`);
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.selectorResults) {
      for (const sr of result.selectorResults) {
        const srIcon = sr.status === "changed" ? "!" : "-";
        const value = sr.matchedValue ? `: ${sr.matchedValue.substring(0, 40)}` : "";
        console.log(`    [${srIcon}] ${sr.name}${value}`);
      }
    }
  }

  console.log(`\nSaving state to ${statePath}...`);
  await saveState(statePath, state);

  console.log(`Appending to ${csvPath}...`);
  await appendToCsv(csvPath, results, config.output?.csv?.columns);

  return {
    configName,
    changed: results.some((r) => r.status === "changed"),
    changes: results.filter((r) => r.status === "changed"),
    errors: results.filter((r) => r.status === "error"),
  };
}

export async function run(configPathsInput: string): Promise<RunOutput> {
  const configPaths = configPathsInput.split(",").map((p) => p.trim());

  console.log(`Processing ${configPaths.length} config(s)...`);

  const configResults: ConfigResult[] = [];

  for (const configPath of configPaths) {
    try {
      const result = await runSingleConfig(resolve(configPath));
      configResults.push(result);
    } catch (error) {
      const configName = basename(configPath, ".yaml");
      if (isSitePatrolError(error)) {
        console.error(`\n[${configName}] Fatal error:`);
        console.error(formatForConsole(error, process.stdout.isTTY ?? false));
      } else {
        console.error(`\n[${configName}] Fatal error:`, error);
      }
      configResults.push({
        configName,
        changed: false,
        changes: [],
        errors: [
          {
            id: configName,
            name: configName,
            url: "",
            timestamp: new Date().toISOString(),
            status: "error",
            currentHash: "",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      });
    }
  }

  const output: RunOutput = {
    changed: configResults.some((r) => r.changed),
    changes: configResults.flatMap((r) => r.changes),
    results: Object.fromEntries(configResults.map((r) => [r.configName, r])),
    errorCount: configResults.reduce((sum, r) => sum + r.errors.length, 0),
    errors: configResults.flatMap((r) => r.errors),
  };

  console.log("\n=== Summary ===");
  for (const r of configResults) {
    const status = r.errors.length > 0 ? "ERROR" : r.changed ? "CHANGED" : "OK";
    console.log(`[${status}] ${r.configName}: ${r.changes.length} changes, ${r.errors.length} errors`);
  }

  return output;
}

async function writeGitHubOutput(output: RunOutput): Promise<void> {
  if (!process.env.GITHUB_OUTPUT) return;

  const changes = output.changes.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    changedSelectors: r.changedSelectors ?? [],
    selectorResults: r.selectorResults?.map((sr) => ({
      name: sr.name,
      status: sr.status,
      matchedValue: sr.matchedValue,
      previousMatchedValue: sr.previousMatchedValue,
    })),
  }));

  const errors = output.errors
    .filter((r) => r.errorDetails)
    .map((r) => r.errorDetails);

  const lines = [
    `changed=${output.changed}`,
    `changes=${JSON.stringify(changes)}`,
    `results=${JSON.stringify(output.results)}`,
    `error_count=${output.errorCount}`,
    `errors=${JSON.stringify(errors)}`,
  ];

  await appendFile(process.env.GITHUB_OUTPUT, lines.join("\n") + "\n");
}

async function main() {
  const configPathsInput = process.argv[2];

  if (!configPathsInput) {
    console.error("Usage: sitedelta <config1.yaml,config2.yaml,...>");
    process.exit(1);
  }

  try {
    const output = await run(configPathsInput);
    await writeGitHubOutput(output);

    if (output.errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
