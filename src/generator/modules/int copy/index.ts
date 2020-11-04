import { FlamestoreModule } from "../../module";
import { Collection, Field } from "../../schema";

export const module: FlamestoreModule = {
  getRule: rule
}


function rule(fieldName: string, field: Field): string[] {
  if (field.type?.int) {
    const min = field.type.int?.min;
    if (min || min === 0) {
      return [`${fieldName} >= ${min}`];
    }
    const max = field.type.int?.max;
    if (max || max === 0) {
      return [`${fieldName} <= ${field.type.int.max}`];
    }
    const deleteDocWhen = field.type.int?.deleteDocWhen;
    if (deleteDocWhen || deleteDocWhen === 0) {
      return [`${fieldName} != ${deleteDocWhen}`];
    }
  }
  return [];
}