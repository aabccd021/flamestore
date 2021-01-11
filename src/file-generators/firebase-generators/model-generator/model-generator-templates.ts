import _ from "lodash";
import { assertNever } from "../../../utils";
import {
  CollectionEntry,
  Field,
  FieldEntry,
  ImageField,
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
  PathField,
} from "../../generator-types";
import { filterMap, suf, sur, t, toPascalColName } from "../../generator-utils";
import { valueOfFieldStr } from "./model-generator-utils";

// import
export const modelImportsStr = t`import { firestore } from 'firebase-admin';
import { onCreateFn, onUpdateFn } from "flamestore/lib";
import {computeDocument} from "./utils";`;

// get computed model interface
export function toComputedModelStr(colEntry: CollectionEntry): string | null {
  const { colName, col } = colEntry;
  const computedFields = filterMap(col.fields, isComputedField, sur('"', '"'));
  //
  if (computedFields.isEmpty()) return null;
  //
  const pascal = toPascalColName(colName);
  return t`const ${colName}ComputeFields = [${computedFields}] as const;
    type ${pascal}C = typeof ${colName}ComputeFields[number];
    export function compute${pascal}<D extends keyof Omit<${pascal},${pascal}C>>(param: {
      dependencyFields: D[];
      onCreate: onCreateFn<${pascal}, ${pascal}C>;
      onUpdate: onUpdateFn<${pascal}, ${pascal}C, D>;
    }) {
      const { dependencyFields, onCreate, onUpdate } = param;
      return computeDocument(
        "${colName}",
        ${colName}ComputeFields,
        dependencyFields,
        onCreate,
        onUpdate,
      )
    }`;
}

// get non computed model interface
export function getNonComputedInterfaceStr(colEntry: CollectionEntry) {
  const { colName, col } = colEntry;
  const modelContentStr = col.fields.map(getNonComputedFieldStr);
  const pascalColName = toPascalColName(colName);
  return t`export interface ${pascalColName} {${modelContentStr}}`;
}
function getNonComputedFieldStr(fEntry: FieldEntry): string {
  const { fName, field } = fEntry;
  const fieldRequiredStr = isFieldRequired(field) ? "" : "?";
  const fieldValueStr = valueOfFieldStr(field);
  return t`${fName}${fieldRequiredStr}: ${fieldValueStr};`;
}
function isFieldRequired(field: Field): boolean {
  if (field.isOptional) return false;
  if (isSumField(field)) return false;
  if (isCountField(field)) return false;
  if (isImageField(field)) return false;
  if (isServerTimestampField(field)) return false;
  if (isComputedField(field)) return false;
  if (isDynamicLinkField(field)) return true;
  if (isFloatField(field)) return true;
  if (isIntField(field)) return true;
  if (isPathField(field)) return true;
  if (isStringField(field)) return true;
  assertNever(field);
}

// special field str
export function getTypeOfImageStr(field: ImageField): string {
  const imageMetadataStr = field.metadatas.map(suf("?: number;")).join("\n");
  return t`{\nurl?: string;\n${imageMetadataStr}\n}`;
}
export function getTypeOfPathStr(field: PathField): string {
  const syncFieldsStr = _(field.syncFields)
    .map(({ fName, field }) => t`${fName}?: ${valueOfFieldStr(field)};`)
    .join("\n");
  return t`{\nreference: firestore.DocumentReference;\n${syncFieldsStr}\n}`;
}

// primitive field str
export function getTypeOfPrimitiveStr(
  field: Exclude<Field, ImageField | PathField>
): tsTypes {
  if (isServerTimestampField(field)) return "firestore.Timestamp";
  if (isSumField(field)) return "number";
  if (isCountField(field)) return "number";
  if (isDynamicLinkField(field)) return "string";
  if (isStringField(field)) return "string";
  if (isIntField(field)) return "number";
  if (isFloatField(field)) return "number";
  if (isComputedField(field)) {
    if (field.computedFieldType === "float") return "number";
    if (field.computedFieldType === "int") return "number";
    if (field.computedFieldType === "timestamp") return "firestore.Timestamp";
    if (field.computedFieldType === "string") return "string";
    assertNever(field.computedFieldType);
  }
  assertNever(field);
}

type tsTypes =
  | "firestore.Timestamp"
  | "number"
  | "firestore.DocumentReference"
  | "string";
