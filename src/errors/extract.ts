import { SitePatrolError } from "./base.js";
import { ErrorCode, ErrorStage } from "./codes.js";

export class ExtractSelectorValueMissingError extends SitePatrolError {
  constructor(selectorType: "css" | "xpath", monitorId?: string) {
    const example = selectorType === "css" ? ".my-class" : '//div[@class="my-class"]';
    super({
      code: ErrorCode.EXTRACT_SELECTOR_VALUE_MISSING,
      stage: ErrorStage.EXTRACT,
      message: `${selectorType.toUpperCase()} selector requires a 'value' field`,
      suggestion: `Add 'value' to selector config. Example: value: "${example}"`,
      context: { selectorType, monitorId },
    });
    this.name = "ExtractSelectorValueMissingError";
  }
}
