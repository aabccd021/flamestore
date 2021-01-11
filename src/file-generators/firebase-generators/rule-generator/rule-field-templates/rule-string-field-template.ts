import _ from "lodash";
import { StringField } from "../../../generator-types";
import { t } from "../../../generator-utils";

export function getStringValStr(field: StringField, fName: string): string[] {
  const { maxLength, minLength, isKeyField } = field;
  const vals = [];
  if (!_.isNil(maxLength)) vals.push(t`${fName}.size() <= ${maxLength}`);
  if (!_.isNil(minLength)) vals.push(t`${fName}.size() >= ${minLength}`);
  if (isKeyField) {
    vals.push(t`${fName} == ${fName}OfDocumentId()`);
  }
  return vals;
}
