import { Field, FlameSchema } from "../../../type";
import {
  isFieldComputed,
  isFieldNotCreatable,
  isFieldOptional,
  isTypeDatetime,
  isTypeDynamicLink,
  isTypeFloat,
  isTypeImage,
  isTypeInt,
  isTypePath,
  isTypeString,
} from "../../utils";
import {
  getTypeOfImageStr,
  getTypeOfPrimStr,
  getTypeOfPathStr,
} from "./model-generator-templates";


export function getIsFieldRequired(field: Field): boolean {
  if (isFieldOptional(field)) return false;
  if (isFieldComputed(field)) return false;
  if (isFieldNotCreatable(field)) return false;
  if (isTypeDynamicLink(field)) return true;
  if (isTypeFloat(field)) return true;
  if (isTypeInt(field)) return true;
  if (isTypePath(field)) return true;
  if (isTypeString(field)) return true;
  if (isTypeDatetime(field)) return true;
  return false;
}

export function valueOfFieldStr(param: {field: Field;schema: FlameSchema;}): string {
  const { field, schema } = param;
  if (isTypeImage(field)) return getTypeOfImageStr(field);
  if (isTypePath(field)) return getTypeOfPathStr(field, schema);
  return getTypeOfPrimStr(field);
}
