import { Field, FieldTypes, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  getRule,
  isCreatable: (field: Field) => field.type != null,
  isUpdatable: (field: Field) => field.type != null,
}


function getRule(fieldName: string, field: Field): string[] {
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