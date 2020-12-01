import { Field, FieldTypes, FlamestoreModule } from "../../../type";
import { isTypeString } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field) => isTypeString(field.type),
  isUpdatable,
  getRule,
}
function isUpdatable(field: Field) {
  return isTypeString(field.type) && !field.type.string.isKey;
}

function getRule(fieldName: string, field: Field): string[] {
  let content = [];
  const fieldType = field.type;
  if (isTypeString(fieldType)) {
    content.push(`${fieldName} is ${FieldTypes.STRING}`)
    if (fieldType.string.isKey) {
      content.push(`${fieldName} == ${fieldName}OfDocumentId()`)
    }
    const maxLength = fieldType.string?.maxLength;
    if (maxLength || maxLength === 0) {
      content.push(`${fieldName}.size() <= ${maxLength}`);
    }
    const minLength = fieldType.string?.minLength;
    if (minLength || minLength === 0) {
      content.push(`${fieldName}.size() >= ${minLength}`);
    }
  }
  return content;
}

