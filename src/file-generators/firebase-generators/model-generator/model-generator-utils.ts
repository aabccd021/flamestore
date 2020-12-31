import { Field, isImageField, isPathField } from "../../types";
import {
  getTypeOfImageStr,
  getTypeOfPrimitiveStr,
  getTypeOfPathStr,
} from "./model-generator-templates";

export function valueOfFieldStr(field: Field): string {
  if (isImageField(field)) return getTypeOfImageStr(field);
  if (isPathField(field)) return getTypeOfPathStr(field);
  return getTypeOfPrimitiveStr(field);
}
