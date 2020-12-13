import { Field, FlamestoreSchema } from "../type";
import * as path from "path";
import * as fs from "fs";
import {
  getPascalCollectionName,
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
  isFieldOptional,
  isFieldComputed,
  isTypeComputed,
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
          const { fName, field } = fIter;
          const mustExists =
            !isFieldOptional(field) &&
            _(modules)
              .map((module) => module.isCreatable)
              .compact()
              .some((isCreatable) => isCreatable(fIter)) &&
            !_(modules)
              .map((module) => module.isNotCreatable)
              .compact()
              .some((isNotCreatable) => isNotCreatable(fIter));
          const question = mustExists ? "" : "?";
          return `${fName}${question}: ${getDataTypeString(field, schema)};`;
        })
        .join("\n");
      return `export interface ${getPascalCollectionName(
        colName
      )} {${attributes}}`;
    })
    .join("\n\n");
  const computedSchemaContent = colIterOf(schema)
    .filter(({ col }) => _(col.fields).some((f) => isFieldComputed(f)))
    .map((colIter) => {
      const { colName } = colIter;
      const pascal = getPascalCollectionName(colName);
      const computedFields = fIterOf(colIter).filter(({ field }) =>
        isFieldComputed(field)
      );
      const computedFieldsUnion = computedFields
        .map(({ fName }) => `"${fName}"`)
        .join("|");
      const computedFieldsParam = computedFields
        .map(({ fName }) => `"${fName}"`)
        .join(",");
      return `type ${pascal}ComputedFields = ${computedFieldsUnion};
      type Computed${pascal} = Omit<${pascal}, ${pascal}ComputedFields>;
      type NonComputed${pascal} = Pick<${pascal}, ${pascal}ComputedFields>;

      export function compute${pascal}<D extends keyof Computed${pascal}>({
        computeOnCreate,
        computeOnUpdate,
        dependencyFields,
      }: {
        computeOnCreate: onCreateFn<Computed${pascal}, NonComputed${pascal}>;
        computeOnUpdate: onUpdateFn<Pick<Computed${pascal}, D>, NonComputed${pascal}>;
        dependencyFields: D[];
      }) {
        return computeDocument({
          computeOnCreate,
          computeOnUpdate,
          dependencyFields: dependencyFields,
          computedFields: [${computedFieldsParam}],
          collection: "${colName}",
        })
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

function getDataTypeString(field: Field, schema: FlamestoreSchema): string {
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
      _([field.syncField ?? []])
        .flatMap()
        .map((fName) => {
          const referencedField =
            schema.collections[field.collection].fields[fName];
          return `${fName}?:${getDataTypeString(referencedField, schema)};`;
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
