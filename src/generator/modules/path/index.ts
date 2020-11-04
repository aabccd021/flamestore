import { Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  getRule,
}


function getRule(fieldName: string, field: Field): string[] {
  if (field?.type?.path) {
    return [`exists(${fieldName})`];
  }
  return [];
}