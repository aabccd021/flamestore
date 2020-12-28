import {
  CollectionIteration as CIter,
  Field,
  FieldIteration as FIter,
  FlamestoreSchema as Schema,
} from "../../type";
import {
  colsOf,
  fItersOf,
  isFieldComputed,
  isFieldNotCreatable,
  isFieldOptional,
  isTypeDatetime,
  isTypeDynamicLink,
  isTypeFloat,
  isTypeInt,
  isTypeReference,
  isTypeString,
} from "../util";
import { typeOf } from "./utils";

export function getNonComputedSchemaString(schema: Schema): string {
  return colsOf(schema).map(getNonComputedSchemaColString).join("\n\n");
}

function getNonComputedSchemaColString(colIter: CIter): string {
  const { pascalColName } = colIter;
  const attributes = fItersOf(colIter)
    .map(getNonComputedSchemaFieldString)
    .join("\n");
  return `export interface ${pascalColName} {${attributes}}`;
}

function getNonComputedSchemaFieldString(fIter: FIter): string {
  const { fName, field } = fIter;
  const questionmark = isFieldRequired(field) ? "" : "?";
  return `${fName}${questionmark}: ${typeOf(fIter)};`;
}

function isFieldRequired(field: Field): boolean {
  if (isFieldOptional(field)) return false;
  return isFieldCreatable(field);
}

function isFieldCreatable(field: Field): boolean {
  if (isFieldComputed(field)) return false;
  if (isFieldNotCreatable(field)) return false;
  if (isTypeDynamicLink(field)) return true;
  if (isTypeFloat(field)) return true;
  if (isTypeInt(field)) return true;
  if (isTypeReference(field)) return true;
  if (isTypeString(field)) return true;
  if (isTypeDatetime(field)) return true;
  return false;
}
