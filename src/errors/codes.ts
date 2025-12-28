export const ErrorCode = {
  // Config errors (1xx)
  CONFIG_FILE_NOT_FOUND: "E101",
  CONFIG_YAML_PARSE_ERROR: "E102",
  CONFIG_VALIDATION_FAILED: "E103",

  // Fetch errors (2xx)
  FETCH_NETWORK_ERROR: "E201",
  FETCH_TIMEOUT: "E202",
  FETCH_HTTP_ERROR: "E203",
  FETCH_PAGE_LOAD_FAILED: "E204",
  FETCH_PLAYWRIGHT_NOT_INSTALLED: "E205",
  FETCH_WAIT_FOR_SELECTOR_TIMEOUT: "E206",

  // Extract errors (3xx)
  EXTRACT_SELECTOR_VALUE_MISSING: "E301",

  // Match errors (4xx)
  MATCH_INVALID_REGEX: "E401",
  MATCH_UNKNOWN_TYPE: "E402",

  // Storage errors (5xx)
  STORAGE_STATE_WRITE_ERROR: "E502",
  STORAGE_STATE_PARSE_ERROR: "E503",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorStage = {
  CONFIG: "config",
  FETCH: "fetch",
  EXTRACT: "extract",
  MATCH: "match",
  STORAGE: "storage",
} as const;

export type ErrorStage = (typeof ErrorStage)[keyof typeof ErrorStage];
