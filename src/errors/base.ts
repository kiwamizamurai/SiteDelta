import type { ErrorCode, ErrorStage } from "./codes.js";

export interface ErrorContext {
  monitorId?: string;
  monitorName?: string;
  url?: string;
  selector?: string;
  selectorType?: string;
  filePath?: string;
  pattern?: string;
  httpStatus?: number;
  attempt?: number;
  maxAttempts?: number;
  mode?: string;
  [key: string]: unknown;
}

export interface SitePatrolErrorOptions {
  code: ErrorCode;
  stage: ErrorStage;
  message: string;
  suggestion: string;
  context?: ErrorContext;
  cause?: Error;
}

export class SitePatrolError extends Error {
  readonly code: ErrorCode;
  readonly stage: ErrorStage;
  readonly suggestion: string;
  readonly context: ErrorContext;
  readonly cause?: Error;
  readonly timestamp: string;

  constructor(options: SitePatrolErrorOptions) {
    super(options.message);
    this.name = "SitePatrolError";
    this.code = options.code;
    this.stage = options.stage;
    this.suggestion = options.suggestion;
    this.context = options.context ?? {};
    this.cause = options.cause;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toGitHubActionsFormat(): string {
    const title = `${this.code} - ${this.stage.toUpperCase()} Error`;
    const lines = [`::error title=${title}::${this.message}`];

    if (Object.keys(this.context).length > 0) {
      const contextStr = Object.entries(this.context)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      lines.push(`Context: ${contextStr}`);
    }

    lines.push(`How to fix: ${this.suggestion}`);

    return lines.join("\n");
  }

  toConsoleFormat(): string {
    const lines = [`[${this.code}] ${this.message}`, "", `Stage: ${this.stage}`];

    if (Object.keys(this.context).length > 0) {
      lines.push("Context:");
      for (const [key, value] of Object.entries(this.context)) {
        if (value !== undefined) {
          lines.push(`  ${key}: ${value}`);
        }
      }
    }

    lines.push("");
    lines.push(`How to fix: ${this.suggestion}`);

    if (this.cause) {
      lines.push("");
      lines.push(`Caused by: ${this.cause.message}`);
    }

    return lines.join("\n");
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      stage: this.stage,
      message: this.message,
      suggestion: this.suggestion,
      context: this.context,
      timestamp: this.timestamp,
      cause: this.cause?.message,
    };
  }
}
