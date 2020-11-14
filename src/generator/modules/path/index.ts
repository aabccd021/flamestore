import { Field, FieldTypes, FlamestoreModule } from "../../type";
import { isTypeReference } from "../../util";

export const module: FlamestoreModule = {
  getRule,
  isCreatable: (field) => isTypeReference(field.type),
  isPrimitive: (field: Field) => !isTypeReference(field.type)
}

function getRule(fieldName: string, field: Field): string[] {
  const rules: string[] = [];
  if (isTypeReference(field.type)) {
    rules.push(`${fieldName} is ${FieldTypes.PATH}`);
    rules.push(`exists(${fieldName})`);
    if (field.type.path.isKey) {
      rules.push(`get(${fieldName}).id == ${fieldName}OfDocumentId()`);
    }
  }
  return rules;
}
