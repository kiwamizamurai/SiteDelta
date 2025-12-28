import { SitePatrolError } from "./base.js";
import { ErrorCode, ErrorStage } from "./codes.js";

export class MatchInvalidRegexError extends SitePatrolError {
  constructor(pattern: string, cause: Error, monitorId?: string) {
    super({
      code: ErrorCode.MATCH_INVALID_REGEX,
      stage: ErrorStage.MATCH,
      message: `Invalid regex pattern: '${pattern}'`,
      suggestion:
        "Check regex syntax. Common issues: unescaped special characters, missing brackets. Test at regex101.com",
      context: { pattern, monitorId },
      cause,
    });
    this.name = "MatchInvalidRegexError";
  }
}

export class MatchUnknownTypeError extends SitePatrolError {
  constructor(matchType: string, monitorId?: string) {
    super({
      code: ErrorCode.MATCH_UNKNOWN_TYPE,
      stage: ErrorStage.MATCH,
      message: `Unknown match type: '${matchType}'`,
      suggestion: "Valid match types: 'regex', 'exact', 'contains'.",
      context: { matchType, monitorId },
    });
    this.name = "MatchUnknownTypeError";
  }
}
