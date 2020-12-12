import { Field, FieldTypes, FlamestoreModule } from "../../../type";
import { isTypeInt } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field) => isTypeInt(field),
  isUpdatable: (field) => isTypeInt(field),
  getRule,
};

function getRule(fieldName: string, field: Field): string[] {
  const content = [];
  if (isTypeInt(field)) {
    content.push(`${fieldName} is ${FieldTypes.INT}`);
    const min = field.min;
    if (min || min === 0) {
      content.push(`${fieldName} >= ${min}`);
    }
    const max = field.max;
    if (max || max === 0) {
      content.push(`${fieldName} <= ${field.max}`);
    }
    const deleteDocWhen = field.deleteDocWhen;
    if (deleteDocWhen || deleteDocWhen === 0) {
      content.push(`${fieldName} != ${deleteDocWhen}`);
    }
  }
  return content;
}
