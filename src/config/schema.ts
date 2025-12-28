import { z } from "zod";

const MatchSchema = z.object({
  type: z.enum(["regex", "exact", "contains"]),
  pattern: z.string(),
  expected: z.string().optional(),
});

const NamedSelectorSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(["css", "xpath", "hash"]),
    value: z.string().optional(),
    match: MatchSchema.optional(),
  })
  .refine((data) => data.type === "hash" || data.value !== undefined, {
    message: "value is required for css and xpath selectors",
  });

const MonitorSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    mode: z.enum(["static", "dynamic"]).default("static"),
    waitFor: z.string().optional(),
    selectors: z.array(NamedSelectorSchema).min(1),
    timeout: z.number().positive().optional(),
    retries: z.number().nonnegative().optional(),
  })
  .refine(
    (data) => {
      const names = data.selectors.map((s) => s.name);
      return new Set(names).size === names.length;
    },
    { message: "Selector names must be unique within a monitor" },
  );

const CsvOutputSchema = z.object({
  path: z.string(),
  columns: z.array(z.string()).optional(),
});

const StateOutputSchema = z.object({
  path: z.string(),
});

const OutputConfigSchema = z.object({
  csv: CsvOutputSchema.optional(),
  state: StateOutputSchema.optional(),
});

const DefaultConfigSchema = z.object({
  timeout: z.number().positive().default(30000),
  retries: z.number().nonnegative().default(1),
  userAgent: z.string().default("SitePatrol/1.0"),
});

export const ConfigSchema = z.object({
  version: z.string(),
  defaults: DefaultConfigSchema.optional(),
  monitors: z.array(MonitorSchema).min(1),
  output: OutputConfigSchema.optional(),
});

export type ConfigOutput = z.output<typeof ConfigSchema>;
