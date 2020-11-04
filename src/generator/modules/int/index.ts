import { Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  getRule: rule
}

function rule(fieldName: string, field: Field): string[] {
  let content = [];
  if (field?.type?.int) {
    const min = field.type.int?.min;
    if (min || min === 0) {
      content.push(`${fieldName} >= ${min}`);
    }
    const max = field.type.int?.max;
    if (max || max === 0) {
      content.push(`${fieldName} <= ${field.type.int.max}`);
    }
    const deleteDocWhen = field.type.int?.deleteDocWhen;
    if (deleteDocWhen || deleteDocWhen === 0) {
      content.push(`${fieldName} != ${deleteDocWhen}`);
    }
  }
  return content;
}