import * as cheerio from "cheerio";
import type { ExtractResult } from "../types.js";
import { computeHash } from "../shared/index.js";

export function extractAndHash(html: string): ExtractResult {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const text = $("body").text();
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const hash = computeHash(normalizedText);

  return {
    content: hash,
    elements: [normalizedText],
  };
}
