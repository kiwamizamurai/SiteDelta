import * as cheerio from "cheerio";
import type { ExtractResult } from "../types.js";

export function extractByCss(html: string, selector: string): ExtractResult {
  const $ = cheerio.load(html);
  const elements: string[] = [];

  $(selector).each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      elements.push(text);
    }
  });

  return { content: elements.join("\n"), elements };
}
