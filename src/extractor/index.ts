import type { ExtractResult } from "../types.js";
import { extractByCss } from "./css.js";
import { extractByXPath } from "./xpath.js";
import { extractAndHash } from "./hash.js";
import { ExtractSelectorValueMissingError } from "../errors/index.js";

type SelectorLike = { type: "css" | "xpath" | "hash"; value?: string };

export function extract(html: string, selector: SelectorLike): ExtractResult {
  switch (selector.type) {
    case "css":
      if (!selector.value) {
        throw new ExtractSelectorValueMissingError("css");
      }
      return extractByCss(html, selector.value);

    case "xpath":
      if (!selector.value) {
        throw new ExtractSelectorValueMissingError("xpath");
      }
      return extractByXPath(html, selector.value);

    case "hash":
      return extractAndHash(html);

    default:
      throw new Error(`Unknown selector type: ${(selector as SelectorLike).type}`);
  }
}
