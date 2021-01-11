import {
  CollectionEntry,
  FieldEntry,
  isComputedField,
  isCountField,
  isImageField,
  isServerTimestampField,
  isSumField,
} from "../../generator-types";
import { t } from "../../generator-utils";
import {
  getFieldType,
  getFieldValidation,
} from "./rule-generator-field-template";
import { indent } from "./rule-generator-utils";

export function toCollectionRuleStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const fieldsStr = col.fields
    .map(toFieldRuleStr)
    .compact()
    .map(indent(2))
    .join("\n");
  // const pascal = toPascalColName(colName);
  return t`match /${colName}/{documentId} {
${fieldsStr}
  function isCreateValid(){
    return reqData().keys().hasOnly([]);
  }
  function isUpdateValid(){
    return updatedKeys().hasOnly([]);
  }
  allow get: if false;
  allow list: if false;
  allow create: if false;
  allow update: if false;
  allow delete: if false;
}`;
}

function toFieldRuleStr(fEntry: FieldEntry): string | null {
  const { field, fName } = fEntry;
  // TODO: add space between bracket
  // TODO: new line if exceeds 63
  if (isCountField(field)) return null;
  if (isImageField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isSumField(field)) return null;
  if (isComputedField(field)) return null;
  const typeStr = getFieldType(field);
  const fieldValidation = getFieldValidation(field, fName);
  const validations = [t`${fName} is ${typeStr}`, ...fieldValidation];
  const validationStrOneLine = validations.join(" && ");
  const validationStr =
    validationStrOneLine.length < 63
      ? validationStrOneLine
      : validations.join("\n    && ");
  return t`function ${fName}IsValid(){
  let ${fName} = reqData().${fName};
  return ${validationStr};
}`;
}
