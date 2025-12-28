import { SitePatrolError } from "./base.js";

export function formatForGitHubActions(error: SitePatrolError | Error): string {
  if (error instanceof SitePatrolError) {
    return error.toGitHubActionsFormat();
  }
  return `::error::${error.message}`;
}

export function formatForConsole(error: SitePatrolError | Error, useColors = true): string {
  if (error instanceof SitePatrolError) {
    if (!useColors) {
      return error.toConsoleFormat();
    }

    const red = "\x1b[31m";
    const yellow = "\x1b[33m";
    const cyan = "\x1b[36m";
    const dim = "\x1b[2m";
    const reset = "\x1b[0m";

    const lines = [
      `${red}[${error.code}]${reset} ${error.message}`,
      "",
      `${dim}Stage:${reset} ${error.stage}`,
    ];

    if (Object.keys(error.context).length > 0) {
      lines.push(`${dim}Context:${reset}`);
      for (const [key, value] of Object.entries(error.context)) {
        if (value !== undefined) {
          lines.push(`  ${cyan}${key}:${reset} ${value}`);
        }
      }
    }

    lines.push("");
    lines.push(`${yellow}How to fix:${reset} ${error.suggestion}`);

    if (error.cause) {
      lines.push("");
      lines.push(`${dim}Caused by:${reset} ${error.cause.message}`);
    }

    return lines.join("\n");
  }

  return error.message;
}

export function isSitePatrolError(error: unknown): error is SitePatrolError {
  return error instanceof SitePatrolError;
}
