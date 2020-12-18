import { FieldIteration, FlamestoreSchema } from "../type";
import * as path from "path";
import * as fs from "fs";
import {
  pascalColName,
  isTypeString,
  isTypeDatetime,
  isTypeFloat,
  isTypeInt,
  isTypeReference,
  isTypeCount,
  isTypeDynamicLink,
  isTypeSum,
  fIterOf,
  colIterOf,
  isFieldComputed,
  isTypeComputed,
  isFieldRequired,
  getSyncFields,
} from "./util";
import _ from "lodash";
import { FlamestoreModule } from "./type";

export function generateSchema(
  outputFilePath: string,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
): void {
  const schemaContent = colIterOf(schema)
    .map((colIter) => {
      const { colName } = colIter;
      const attributes = fIterOf(colIter)
        .map((fIter) => {
          const { fName } = fIter;
          const mustExists = isFieldRequired(fIter, modules);
          const question = mustExists ? "" : "?";
          return `${fName}${question}: ${getDataTypeString(fIter)};`;
        })
        .join("\n");
      return `export interface ${pascalColName(colName)} {${attributes}}`;
    })
    .join("\n\n");
  const computedSchemaContent = colIterOf(schema)
    .filter(({ col }) => _(col.fields).some((f) => isFieldComputed(f)))
    .map((colIter) => {
      const { colName } = colIter;
      const pascal = pascalColName(colName);
      const computedFields = fIterOf(colIter).filter(({ field }) =>
        isFieldComputed(field)
      );
      const computedFieldsParam = computedFields
        .map(({ fName }) => `"${fName}"`)
        .join(",");
      return `const ${colName}ComputeFields = [${computedFieldsParam}] as const;
        type ${pascal}C = typeof ${colName}ComputeFields[number];
        export function compute${pascal}<D extends keyof Omit<${pascal},${pascal}C>>({
        dependencyFields,
        onCreate,
        onUpdate,
      }: {
        dependencyFields: D[];
        onCreate: onCreateFn<${pascal}, ${pascal}C>;
        onUpdate: onUpdateFn<${pascal}, ${pascal}C, D>;
      }) {
        return computeDocument(
          "${colName}",
          ${colName}ComputeFields,
          dependencyFields,
          onCreate,
          onUpdate,
        )
      }
      `;
    })
    .join("\n");
  const finalContent = `
import { firestore } from 'firebase-admin';
import { onCreateFn, onUpdateFn } from "flamestore/lib";
import {computeDocument} from "./utils";

${schemaContent}

${computedSchemaContent}
`;
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, finalContent);
}

function getDataTypeString({
  field,
  col,
  colName,
  schema,
}: FieldIteration): string {
  const colIter = { col, colName, schema };
  if (isTypeComputed(field)) {
    if (field.compute === "float" || field.compute === "int") {
      return "number";
    }
    if (field.compute === "path") {
      return "firestore.DocumentReference";
    }
    if (field.compute === "timestamp") {
      return "firestore.Timestamp";
    }
    if (field.compute === "string") {
      return "string";
    }
  }
  if (isTypeString(field)) {
    return "string";
  }
  if (isTypeDatetime(field)) {
    return "firestore.Timestamp";
  }
  if (isTypeInt(field)) {
    return "number";
  }
  if (isTypeFloat(field)) {
    return "number";
  }
  if (isTypeReference(field)) {
    const fieldString =
      getSyncFields(field, colIter)
        .map((fIter) => {
          return `${fIter.fName}?:${getDataTypeString(fIter)};`;
        })
        .join("\n") ?? "";
    return `{
      reference: firestore.DocumentReference;
      ${fieldString}
    }`;
  }
  if (isTypeSum(field)) {
    return "number";
  }
  if (isTypeCount(field)) {
    return "number";
  }
  if (isTypeDynamicLink(field)) {
    return "string";
  }
  if (field === "serverTimestamp") {
    return "firestore.Timestamp";
  }
  throw Error(`Unknown field type: ${field}`);
}
