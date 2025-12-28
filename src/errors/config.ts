import { SitePatrolError } from "./base.js";
import { ErrorCode, ErrorStage } from "./codes.js";

export class ConfigFileNotFoundError extends SitePatrolError {
  constructor(filePath: string) {
    super({
      code: ErrorCode.CONFIG_FILE_NOT_FOUND,
      stage: ErrorStage.CONFIG,
      message: `Configuration file not found: ${filePath}`,
      suggestion: `Create a config file at '${filePath}' or specify a different path. See examples/ directory for templates.`,
      context: { filePath },
    });
    this.name = "ConfigFileNotFoundError";
  }
}

export class ConfigYamlParseError extends SitePatrolError {
  constructor(filePath: string, cause: Error) {
    super({
      code: ErrorCode.CONFIG_YAML_PARSE_ERROR,
      stage: ErrorStage.CONFIG,
      message: `Invalid YAML syntax in config file: ${cause.message}`,
      suggestion:
        "Check YAML syntax. Common issues: incorrect indentation, missing colons, unquoted special characters.",
      context: { filePath },
      cause,
    });
    this.name = "ConfigYamlParseError";
  }
}

export class ConfigValidationError extends SitePatrolError {
  constructor(errors: Array<{ path: string; message: string }>, filePath: string) {
    const errorList = errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n");
    super({
      code: ErrorCode.CONFIG_VALIDATION_FAILED,
      stage: ErrorStage.CONFIG,
      message: `Configuration validation failed:\n${errorList}`,
      suggestion:
        "Review config against schema. Each monitor requires: id, name, url, selector. CSS/XPath selectors need a value field.",
      context: { filePath, errorCount: errors.length },
    });
    this.name = "ConfigValidationError";
  }
}
