import { Field, FieldTypes, FlamestoreModule } from "../../../type";
import { isTypeInt } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field) => isTypeInt(field),
  isUpdatable: (field) => isTypeInt(field),
  getRule
};

function getRule(fieldName: string, field: Field): string[] {
  const content = [];
  const fieldType = field;
  if (isTypeInt(fieldType)) {
    content.push(`${fieldName} is ${FieldTypes.INT}`);
    const min = fieldType.int?.min;
    if (min || min === 0) {
      content.push(`${fieldName} >= ${min}`);
    }
    const max = fieldType.int?.max;
    if (max || max === 0) {
      content.push(`${fieldName} <= ${fieldType.int.max}`);
    }
    const deleteDocWhen = fieldType.int?.deleteDocWhen;
    if (deleteDocWhen || deleteDocWhen === 0) {
      content.push(`${fieldName} != ${deleteDocWhen}`);
    }
  }
  return content;
}