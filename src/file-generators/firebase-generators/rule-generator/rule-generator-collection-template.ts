import { assertNever } from "../../../utils";
import {
  CollectionEntry,
  FieldEntry,
  isComputedField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isImageField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
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
  const keyStr = toKeyStr(col.fields).map(indent(2)).join("\n");
  return t`match /${colName}/{documentId} {
${keyStr}
  function isReqOwner(){}
  function isResOwner(){}
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

function toKeyStr(fEntries: _.Collection<FieldEntry>): _.Collection<string> {
  return fEntries
    .filter(isKeyField)
    .map(
      ({ fName }, idx) =>
        t`function ${fName}OfDocumentId(){ return documentId.split('_')[${idx}]; }`
    );
}

function isKeyField({ field }: FieldEntry): boolean {
  if (isCountField(field)) return false;
  if (isImageField(field)) return false;
  if (isServerTimestampField(field)) return false;
  if (isSumField(field)) return false;
  if (isComputedField(field)) return false;
  if (isDynamicLinkField(field)) return false;
  if (isFloatField(field)) return false;
  if (isIntField(field)) return false;
  if (isStringField(field)) return field.isKeyField;
  if (isPathField(field)) return field.isKeyField;
  assertNever(field);
}
