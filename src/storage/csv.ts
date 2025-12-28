import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";
import { stringify } from "csv-stringify/sync";
import type { CsvRecord, CheckResult } from "../types.js";

const DEFAULT_COLUMNS: (keyof CsvRecord)[] = [
  "timestamp",
  "id",
  "name",
  "url",
  "selector",
  "status",
  "hash",
  "matched_value",
  "diff_summary",
];

function toCsvRecords(result: CheckResult): CsvRecord[] {
  if (!result.selectorResults) {
    return [];
  }
  return result.selectorResults.map((sr) => ({
    timestamp: result.timestamp,
    id: result.id,
    name: result.name,
    url: result.url,
    selector: sr.name,
    status: sr.status,
    hash: sr.hash,
    matched_value: sr.matchedValue ?? "",
    diff_summary: sr.diff?.summary ?? "",
  }));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function appendToCsv(
  csvPath: string,
  results: CheckResult[],
  columns: string[] = DEFAULT_COLUMNS,
): Promise<void> {
  await mkdir(dirname(csvPath), { recursive: true });

  const records = results.flatMap(toCsvRecords);
  const exists = await fileExists(csvPath);

  if (!exists) {
    const csv = stringify(records, { header: true, columns: columns as string[] });
    await writeFile(csvPath, csv, "utf-8");
  } else {
    const csv = stringify(records, { header: false, columns: columns as string[] });
    const existing = await readFile(csvPath, "utf-8");
    await writeFile(csvPath, existing + csv, "utf-8");
  }
}
