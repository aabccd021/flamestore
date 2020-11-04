import { Collection, Field, FlamestoreSchema } from "./schema";

export interface FlamestoreModule {
  validateRaw?: (rawSchema: any) => void,
  validate?: (schema: FlamestoreSchema) => void,
  ruleFunction?: (collection: Collection) => string[],
  getRule?: (fieldName: string, field: Field) => string[],
}