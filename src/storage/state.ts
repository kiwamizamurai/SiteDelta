import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { State, MonitorState } from "../types.js";
import { StorageStateParseError, StorageStateWriteError } from "../errors/index.js";

const DEFAULT_STATE: State = { monitors: {} };

export async function loadState(statePath: string): Promise<State> {
  try {
    const content = await readFile(statePath, "utf-8");
    try {
      return JSON.parse(content) as State;
    } catch (parseError) {
      throw new StorageStateParseError(statePath, parseError as Error);
    }
  } catch (error) {
    if (error instanceof StorageStateParseError) {
      throw error;
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return DEFAULT_STATE;
    }
    throw error;
  }
}

export async function saveState(statePath: string, state: State): Promise<void> {
  try {
    await mkdir(dirname(statePath), { recursive: true });
    const content = JSON.stringify(state, null, 2);
    await writeFile(statePath, content, "utf-8");
  } catch (error) {
    throw new StorageStateWriteError(statePath, error as Error);
  }
}

export function getMonitorState(state: State, monitorId: string): MonitorState | undefined {
  return state.monitors[monitorId];
}

export function updateMonitorState(
  state: State,
  monitorId: string,
  update: Partial<MonitorState> & { hash: string; lastChecked: string },
): State {
  const existing = state.monitors[monitorId];

  return {
    ...state,
    monitors: {
      ...state.monitors,
      [monitorId]: { ...existing, ...update },
    },
    lastRun: new Date().toISOString(),
  };
}
