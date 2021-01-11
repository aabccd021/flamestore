import { assertNever } from "../../../utils";
import {
  isDynamicLinkField,
  isFloatField,
  isIntField,
  isPathField,
  isStringField,
  DynamicLinkField,
  FloatField,
  IntField,
  PathField,
  StringField,
} from "../../generator-types";
import { getDynamicLinkValStr } from "./rule-field-templates/rule-dynamic-link-field-template";
import { getFloatValStr } from "./rule-field-templates/rule-float-field-template";
import { getIntValStr } from "./rule-field-templates/rule-int-field-template";
import { getPathValStr } from "./rule-field-templates/rule-path-field-template";
import { getStringValStr } from "./rule-field-templates/rule-string-field-template";

type AllowedTypes =
  | DynamicLinkField
  | FloatField
  | IntField
  | PathField
  | StringField;

type RuleType =
  | "bool"
  | "int"
  | "float"
  | "number"
  | "string"
  | "list"
  | "map"
  | "timestamp"
  | "duration"
  | "path"
  | "latlng";

export function getFieldType(field: AllowedTypes): RuleType {
  if (isDynamicLinkField(field)) return "string";
  if (isFloatField(field)) return "float";
  if (isIntField(field)) return "int";
  if (isPathField(field)) return "map";
  if (isStringField(field)) return "string";
  assertNever(field);
}

export function getFieldValidation(
  field: AllowedTypes,
  fName: string
): string[] {
  if (isDynamicLinkField(field)) return getDynamicLinkValStr(field, fName);
  if (isFloatField(field)) return getFloatValStr(field, fName);
  if (isIntField(field)) return getIntValStr(field, fName);
  if (isPathField(field)) return getPathValStr(field, fName);
  if (isStringField(field)) return getStringValStr(field, fName);
  assertNever(field);
}
