import { SitePatrolError } from "./base.js";
import { ErrorCode, ErrorStage } from "./codes.js";

export class StorageStateParseError extends SitePatrolError {
  constructor(filePath: string, cause: Error) {
    super({
      code: ErrorCode.STORAGE_STATE_PARSE_ERROR,
      stage: ErrorStage.STORAGE,
      message: `Invalid JSON in state file: ${filePath}`,
      suggestion: "State file may be corrupted. Delete it and run again to create fresh state.",
      context: { filePath },
      cause,
    });
    this.name = "StorageStateParseError";
  }
}

export class StorageStateWriteError extends SitePatrolError {
  constructor(filePath: string, cause: Error) {
    let suggestion = "Check file permissions and available disk space.";
    if (cause.message.includes("EACCES") || cause.message.includes("permission")) {
      suggestion = `Permission denied. Check write permissions for '${filePath}'.`;
    } else if (cause.message.includes("ENOSPC") || cause.message.includes("space")) {
      suggestion = "Disk is full. Free up disk space.";
    }

    super({
      code: ErrorCode.STORAGE_STATE_WRITE_ERROR,
      stage: ErrorStage.STORAGE,
      message: `Failed to write state file: ${filePath}`,
      suggestion,
      context: { filePath },
      cause,
    });
    this.name = "StorageStateWriteError";
  }
}
