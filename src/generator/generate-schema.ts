import { Field, FlamestoreModule, FlamestoreSchema } from "../type";
import * as path from "path";
import {
  getPascalCollectionName,
  isComputed,
  isOptional,
  isTypeString,
  isTypeDatetime,
  isTypeFloat,
  isTypeInt,
  isTypeReference,
  isTypeCount,
  isTypeDynamicLink,
  isTypeSum,
  writePrettyFile,
} from "./util";

export function generateSchema(
  outputFilePath: string,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
): void {
  const schemaContent = Object.entries(schema.collections)
    .map(([colName, col]) => {
      const attributes = Object.entries(col.fields)
        .map(([fieldName, field]) => {
          const mustExists = modules.some((module) => {
            if (isOptional(field)) {
              return false;
            }
            if (module.isCreatable) {
              return module.isCreatable(field);
            }
            return false;
          });
          let finalMustExists = mustExists;
          for (const module of modules) {
            if (module.isCreatableOverride) {
              const creatableOverride = module.isCreatableOverride(field);
              if (creatableOverride !== undefined) {
                finalMustExists = creatableOverride;
              }
            }
          }
          const question = finalMustExists ? "" : "?";
          return `${fieldName}${question}: ${getDataTypeString(
            field,
            schema
          )};`;
        })
        .join("\n");
      return fieldString(colName, attributes);
    })
    .join("\n");
  const computedSchemaContent = Object.entries(schema.collections)
    .filter(([_, col]) => Object.values(col.fields).some((f) => isComputed(f)))
    .map(([colName, col]) => {
      const computedFields = Object.entries(col.fields).filter(([_, field]) =>
        isComputed(field)
      );
      const computedFieldDeclaration = computedFields
        .map(
          ([fieldName, field]) =>
            `private ${fieldName}?: ${getDataTypeString(field, schema)};`
        )
        .join("\n");
      const computedFieldType = computedFields
        .map(
          ([fieldName, field]) =>
            `${fieldName}?: ${getDataTypeString(field, schema)},`
        )
        .join("\n");
      const computedFieldAssignment = computedFields
        .map(([fieldName, _]) => `this.${fieldName} = arg?.${fieldName};`)
        .join("\n");
      const computedFieldReturn = computedFields
        .map(
          ([fieldName, _]) =>
            `if(this.${fieldName}){data.${fieldName}= this.${fieldName};}`
        )
        .join("\n");
      const isNonComputedSameVars = Object.entries(col.fields)
        .map(([fieldName, field]) => {
          const varName = `${fieldName}:`;
          if (computedFields.map(([e, _]) => e).includes(fieldName)) {
            return `${varName} true`;
          }
          const isEqual = isFieldEqual(fieldName, field, modules, schema);
          return `${varName} ${isEqual}`;
        })
        .sort()
        .join(",\n");
      return computedFieldString(
        colName,
        computedFieldDeclaration,
        computedFieldType,
        computedFieldAssignment,
        computedFieldReturn,
        isNonComputedSameVars
      );
    })
    .join("\n");
  const finalContents = schemaString(schemaContent + computedSchemaContent);
  const fileName = path.join(outputFilePath, "models.ts");
  writePrettyFile(fileName, finalContents);
}

function computedFieldString(
  colName: string,
  fieldDeclaration: string,
  fieldType: string,
  fieldAssignment: string,
  fieldReturn: string,
  isNonComputedSameVars: string
): string {
  const pascal = getPascalCollectionName(colName);
  const ICol = `I${pascal}`;
  return `
export class Computed${pascal} extends Computed {
  public collection: string;
  public document!: ${ICol};
  ${fieldDeclaration}
  constructor(arg?: {
    ${fieldType}
  }) {
    super();
    this.collection = '${colName}';
    ${fieldAssignment}
  }

  public toMap() {
    const data: { [fieldName: string]: any } = {};
    ${fieldReturn}
    return data;
  }

  public isDependencyChanged<K extends keyof ${ICol}>(before: ${ICol}, after: ${ICol}, keys: K[]) {
    const isValueSame = {
    ${isNonComputedSameVars}
    };
    return keys.some(key => !isValueSame[key])
  }
  }
  `;
}

function fieldString(colName: string, attributes: string): string {
  return `
    export interface I${getPascalCollectionName(colName)} {
    ${attributes}
  }
  `;
}

function isFieldEqual(
  fieldName: string,
  field: Field,
  modules: FlamestoreModule[],
  schema: FlamestoreSchema,
  prefix = ""
): string {
  if (isTypeReference(field)) {
    const referenceIsEqueal = `before?.${fieldName}?.reference  ? after?.${fieldName}?.reference ? before.${fieldName}.reference.isEqual(after.${fieldName}.reference):  false :after?.${fieldName}?.reference ?false: true`;
    const fields = schema.collections[field.collection].fields;
    const otherFieldsIsEqual =
      field.syncFields?.map((syncFieldName) =>
        isFieldEqual(
          syncFieldName,
          fields[syncFieldName],
          modules,
          schema,
          `.${fieldName}`
        )
      ) ?? [];
    const isEqual = [referenceIsEqueal, ...otherFieldsIsEqual]
      .map((e) => `(${e})`)
      .join(" && ");
    return `${isEqual}`;
  }
  const aprefix = prefix === "" ? prefix : `?${prefix}`;
  if (
    modules.every((module) =>
      module.isPrimitive ? module.isPrimitive(field) : true
    )
  ) {
    return `before${aprefix}?.${fieldName} === after${aprefix}?.${fieldName}`;
  }
  return `before${aprefix}?.${fieldName}  ? after${aprefix}?.${fieldName} ? before${prefix}.${fieldName}.isEqual(after${prefix}.${fieldName}):  false :after?.${fieldName} ?false: true`;
}

function schemaString(schemaContent: string): string {
  return `
import { firestore } from 'firebase-admin';
import { Computed } from "flamestore";
${schemaContent}
`;
}

function getDataTypeString(field: Field, schema: FlamestoreSchema): string {
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
    const fields =
      field.syncFields
        ?.map((fieldName) => {
          const referencedField =
            schema.collections[field.collection].fields[fieldName];
          return `${fieldName}?:${getDataTypeString(referencedField, schema)};`;
        })
        .join("\n") ?? "";
    return `{
      reference: firestore.DocumentReference;
      ${fields}
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
