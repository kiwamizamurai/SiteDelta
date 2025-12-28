import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { ConfigSchema, type ConfigOutput } from "./schema.js";
import type { Config } from "../types.js";
import {
  ConfigFileNotFoundError,
  ConfigYamlParseError,
  ConfigValidationError,
} from "../errors/index.js";

function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    return process.env[envVar] ?? "";
  });
}

function expandEnvVarsInObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return expandEnvVars(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(expandEnvVarsInObject) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = expandEnvVarsInObject(value);
    }
    return result as T;
  }
  return obj;
}

export async function loadConfig(configPath: string): Promise<Config> {
  let content: string;
  try {
    content = await readFile(configPath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigFileNotFoundError(configPath);
    }
    throw error;
  }

  let rawConfig: unknown;
  try {
    rawConfig = parseYaml(content);
  } catch (error) {
    throw new ConfigYamlParseError(configPath, error as Error);
  }

  const expandedConfig = expandEnvVarsInObject(rawConfig);
  const result = ConfigSchema.safeParse(expandedConfig);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      path: e.path.join(".") || "(root)",
      message: e.message,
    }));
    throw new ConfigValidationError(errors, configPath);
  }

  return applyDefaults(result.data);
}

function applyDefaults(config: ConfigOutput): Config {
  const defaults = config.defaults ?? {
    timeout: 30000,
    retries: 1,
    userAgent: "SitePatrol/1.0",
  };

  return {
    ...config,
    defaults,
    monitors: config.monitors.map((monitor) => ({
      ...monitor,
      timeout: monitor.timeout ?? defaults.timeout,
      retries: monitor.retries ?? defaults.retries,
    })),
    output: config.output ?? {
      csv: { path: "./data/history.csv" },
      state: { path: "./data/state.json" },
    },
  };
}
