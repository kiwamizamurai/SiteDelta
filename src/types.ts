export interface Config {
  version: string;
  defaults?: DefaultConfig;
  monitors: Monitor[];
  output?: OutputConfig;
}

export interface DefaultConfig {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  mode?: "static" | "dynamic";
  waitFor?: string;
  selectors: NamedSelector[];
  timeout?: number;
  retries?: number;
}

export interface NamedSelector {
  name: string;
  type: "css" | "xpath" | "hash";
  value?: string;
  match?: MatchConfig;
}

export interface MatchConfig {
  type: "regex" | "exact" | "contains";
  pattern: string;
  expected?: string;
}

export interface OutputConfig {
  csv?: CsvOutputConfig;
  state?: StateOutputConfig;
}

export interface CsvOutputConfig {
  path: string;
  columns?: string[];
}

export interface StateOutputConfig {
  path: string;
}

export interface State {
  monitors: Record<string, MonitorState>;
  lastRun?: string;
}

export interface SelectorState {
  hash: string;
  matchedValue?: string;
}

export interface MonitorState {
  hash: string;
  matchedValue?: string;
  lastChecked: string;
  lastChanged?: string;
  selectors?: Record<string, SelectorState>;
}

export interface CheckResultError {
  code: string;
  stage: string;
  message: string;
  suggestion: string;
  context?: Record<string, unknown>;
}

export interface SelectorResult {
  name: string;
  status: "changed" | "unchanged";
  hash: string;
  previousHash?: string;
  content: string;
  matchedValue?: string;
  previousMatchedValue?: string;
  diff?: DiffResult;
}

export interface CheckResult {
  id: string;
  name: string;
  url: string;
  timestamp: string;
  status: "changed" | "unchanged" | "error";
  currentHash: string;
  previousHash?: string;
  matchedValue?: string;
  previousMatchedValue?: string;
  selectorResults?: SelectorResult[];
  changedSelectors?: string[];
  diff?: DiffResult;
  error?: string;
  errorDetails?: CheckResultError;
}

export interface DiffResult {
  added: string[];
  removed: string[];
  summary: string;
}

export interface FetchResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
  waitFor?: string;
}

export interface ExtractResult {
  content: string;
  elements: string[];
}

export interface CsvRecord {
  timestamp: string;
  id: string;
  name: string;
  url: string;
  selector: string;
  status: "changed" | "unchanged" | "error";
  hash: string;
  matched_value: string;
  diff_summary: string;
}

export interface ConfigResult {
  configName: string;
  changed: boolean;
  changes: CheckResult[];
  errors: CheckResult[];
}

export interface RunOutput {
  changed: boolean;
  changes: CheckResult[];
  results: Record<string, ConfigResult>;
  errorCount: number;
  errors: CheckResult[];
}
