import type { DiffResult } from "../types.js";
import { computeHash } from "../shared/index.js";

export function detectChanges(previous: string, current: string): DiffResult | null {
  if (previous === current) {
    return null;
  }

  const prevLines = previous.split("\n");
  const currLines = current.split("\n");
  const prevSet = new Set(prevLines);
  const currSet = new Set(currLines);

  const added = currLines.filter((line) => !prevSet.has(line) && line.trim());
  const removed = prevLines.filter((line) => !currSet.has(line) && line.trim());

  return {
    added,
    removed,
    summary: `+${added.length} lines, -${removed.length} lines`,
  };
}

export function getContentHash(content: string): string {
  return computeHash(content);
}
