import type { MatchConfig } from "../types.js";
import { MatchInvalidRegexError, MatchUnknownTypeError } from "../errors/index.js";

interface MatchResult {
  matched: boolean;
  value?: string;
  captures?: string[];
}

export function matchContent(content: string, config: MatchConfig): MatchResult {
  switch (config.type) {
    case "regex":
      return matchRegex(content, config.pattern);
    case "exact":
      return matchExact(content, config.pattern);
    case "contains":
      return matchContains(content, config.pattern);
    default:
      throw new MatchUnknownTypeError((config as MatchConfig).type);
  }
}

function matchRegex(content: string, pattern: string): MatchResult {
  try {
    const regex = new RegExp(pattern, "g");
    const matches = content.match(regex);

    if (!matches) {
      return { matched: false };
    }

    const firstMatch = new RegExp(pattern).exec(content);
    const captures = firstMatch ? firstMatch.slice(1) : [];

    return { matched: true, value: matches[0], captures };
  } catch (error) {
    throw new MatchInvalidRegexError(pattern, error instanceof Error ? error : new Error(String(error)));
  }
}

function matchExact(content: string, pattern: string): MatchResult {
  const matched = content === pattern;
  return { matched, value: matched ? content : undefined };
}

function matchContains(content: string, pattern: string): MatchResult {
  const matched = content.includes(pattern);
  return { matched, value: matched ? pattern : undefined };
}
