import { Collection, FieldContent, FlamestoreSchema } from "./schema";

export interface FlamestoreModule {
  validateRaw?: (rawSchema: any) => void,
  validate?: (schema: FlamestoreSchema) => void,
  ruleFunction?: (collection: Collection) => string[],
  rule?: (fieldName: string, field: FieldContent) => string[],
}