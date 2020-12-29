import {
  CollectionIteration,
  Field,
  FlamestoreSchema,
  ImageField,
  PathField,
} from "../../../type";
import {
  assertNever,
  fItersOf,
  getImageMetadatas,
  getSyncFields,
  isFieldComputed,
  isTypeComputed,
  isTypeCount,
  isTypeDatetime,
  isTypeDynamicLink,
  isTypeFloat,
  isTypeInt,
  isTypeString,
  isTypeSum,
  toPascalColName,
} from "../../utils";
import { valueOfFieldStr } from "./model-generator-utis";

export function toComputedModelStr(
  colIter: CollectionIteration
): string | null {
  const { colName } = colIter;
  const computedFields = fItersOf(colIter)
    .filter(({ field }) => isFieldComputed(field))
    .map(({ fName }) => `"${fName}"`);
  if (computedFields.isEmpty()) return null;
  const pascal = toPascalColName(colName);
  return `const ${colName}ComputeFields = [${computedFields}] as const;
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

export const schemaImportsStr = `import { firestore } from 'firebase-admin';
import { onCreateFn, onUpdateFn } from "flamestore/lib";
import {computeDocument} from "./utils";`;

export function getNonComputedInterfaceStr(param: {
  colName: string;
  interfaceContent: string;
}) {
  const { colName, interfaceContent } = param;
  const pascalColName = toPascalColName(colName);
  return `export interface ${pascalColName} {${interfaceContent}}`;
}
export function getNonComputedFieldStr(param: {
  fName: string;
  isFieldRequired: boolean;
  fieldValueStr: string;
}): string {
  const { fName, isFieldRequired, fieldValueStr } = param;
  const optionalStr = isFieldRequired ? "" : "?";
  return `${fName}${optionalStr}: ${fieldValueStr};`;
}

export function getTypeOfImageStr(field: ImageField): string {
  const imageMetadataStr = getImageMetadatas(field)
    .map((data) => `${data}?: number;`)
    .join("\n");
  return `{
    url?: string;
    ${imageMetadataStr}
  }`;
}

export function getTypeOfPathStr(
  field: PathField,
  schema: FlamestoreSchema
): string {
  return `{
    reference: firestore.DocumentReference;
    ${getSyncFields(field, schema)
      .map((fIter) => `${fIter.fName}?:${valueOfFieldStr(fIter)};`)
      .join("\n")}
  }`;
}

export function getTypeOfPrimStr(
  field: Exclude<Field, ImageField | PathField>
): tsTypes {
  if (field === "serverTimestamp") return "firestore.Timestamp";
  if (isTypeSum(field)) return "number";
  if (isTypeCount(field)) return "number";
  if (isTypeDynamicLink(field)) return "string";
  if (isTypeString(field)) return "string";
  if (isTypeDatetime(field)) return "firestore.Timestamp";
  if (isTypeInt(field)) return "number";
  if (isTypeFloat(field)) return "number";
  if (isTypeComputed(field)) {
    if (field.compute === "float") return "number";
    if (field.compute === "int") return "number";
    if (field.compute === "path") return "firestore.DocumentReference";
    if (field.compute === "timestamp") return "firestore.Timestamp";
    if (field.compute === "string") return "string";
    assertNever(field.compute);
  }
  assertNever(field);
}

type tsTypes =
  | "firestore.Timestamp"
  | "number"
  | "firestore.DocumentReference"
  | "string";
