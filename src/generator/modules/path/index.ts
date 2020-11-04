import { FlamestoreModule } from "../../module";
import { Collection, Field } from "../../schema";

export const module: FlamestoreModule = {
  getRule: rule
}


function rule(fieldName: string, field: Field): string[] {
  if (field?.type?.path) {
    return [`exists(${fieldName})`];
  }
  return [];
}