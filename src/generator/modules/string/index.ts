import { Collection, Field, FieldTypes, FlamestoreModule } from "../../../type";
import { isTypeString } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field) => isTypeString(field),
  isUpdatable: (field) => isTypeString(field),
  getRule,
};

function getRule(
  fieldName: string,
  field: Field,
  _: string,
  collection: Collection
): string[] {
  const content = [];
  const fieldType = field;
  if (isTypeString(fieldType)) {
    content.push(`${fieldName} is ${FieldTypes.STRING}`);
    if (collection.keyFields?.includes(fieldName) ?? false) {
      content.push(`${fieldName} == ${fieldName}OfDocumentId()`);
    }
    const maxLength = fieldType.maxLength;
    if (maxLength || maxLength === 0) {
      content.push(`${fieldName}.size() <= ${maxLength}`);
    }
    const minLength = fieldType.minLength;
    if (minLength || minLength === 0) {
      content.push(`${fieldName}.size() >= ${minLength}`);
    }
  }
  return content;
}
