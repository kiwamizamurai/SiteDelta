import * as cheerio from "cheerio";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";
import type { ExtractResult } from "../types.js";

export function extractByXPath(html: string, xpathQuery: string): ExtractResult {
  // First, use cheerio to properly parse HTML and convert to XHTML
  const $ = cheerio.load(html, { xml: false });
  const xhtml = $.xml();

  const parser = new DOMParser({
    errorHandler: () => {},
  });

  const doc = parser.parseFromString(xhtml, "text/xml");
  const nodes = xpath.select(xpathQuery, doc as unknown as Node);
  const elements: string[] = [];

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      const nodeValue = node as unknown;
      if (typeof nodeValue === "string") {
        elements.push(nodeValue.trim());
      } else if (nodeValue && typeof nodeValue === "object" && "textContent" in nodeValue) {
        const text = String((nodeValue as { textContent?: string }).textContent ?? "").trim();
        if (text) {
          elements.push(text);
        }
      }
    }
  } else if (typeof nodes === "string") {
    elements.push(nodes.trim());
  } else if (typeof nodes === "number" || typeof nodes === "boolean") {
    elements.push(String(nodes));
  }

  return { content: elements.join("\n"), elements };
}
