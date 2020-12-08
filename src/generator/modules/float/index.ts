import { Field, FieldTypes, FlamestoreModule } from "../../../type";
import { isTypeFloat } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field) => isTypeFloat(field),
  isUpdatable: (field) => isTypeFloat(field),
  getRule
};

function getRule(fieldName: string, field: Field): string[] {
  const content = [];
  const fieldType = field;
  if (isTypeFloat(fieldType)) {
    content.push(`${fieldName} is ${FieldTypes.FLOAT}`);
    const min = fieldType.float?.min;
    if (min || min === 0) {
      content.push(`${fieldName} >= ${min}`);
    }
    const max = fieldType.float?.max;
    if (max || max === 0) {
      content.push(`${fieldName} <= ${fieldType.float.max}`);
    }
    const deleteDocWhen = fieldType.float?.deleteDocWhen;
    if (deleteDocWhen || deleteDocWhen === 0) {
      content.push(`${fieldName} != ${deleteDocWhen}`);
    }
  }
  return content;
}