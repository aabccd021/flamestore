import { FlamestoreModule } from "../../module";
import { Collection, Field, FieldTypes } from "../../schema";

export const module: FlamestoreModule = {
  getRule: rule
}


function rule(fieldName: string, field: Field): string[] {
  if (field.type) {
    if (!field.type?.timestamp?.serverTimestamp) {
      for (const fieldType of Object.values(FieldTypes)) {
        if (field?.type?.[fieldType]) {
          return [`${fieldName} is ${fieldType}`];
        }
      }
    }
  }
  return [];
}