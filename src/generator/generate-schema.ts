import { Field, FieldTypes, FlamestoreModule, FlamestoreSchema } from "./type";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { getPascalCollectionName, getFieldType } from "./util";


export function generateSchema(
  outputFilePath: string,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[],
) {

  const schemaContent = Object.entries(schema.collections)
    .map(([colName, col]) => {
      const attributes =
        Object.entries(col.fields)
          .map(([fieldName, field]) => {
            const mustExists = modules.every(module => module.isCreatable ? module.isCreatable(field) && !field?.isOptional : true);
            const question = mustExists ? '' : '?';
            return `${fieldName}${question}: ${getDataTypeString(field, fieldName, colName, schema)};`
          })
          .join('\n');
      return fieldString(colName, attributes);
    })
    .join('\n');
  const computedSchemaContent = Object.entries(schema.collections)
    .filter(([_, col]) => Object.values(col.fields).some(f => f?.isComputed))
    .map(([colName, col]) => {
      const computedFields = Object.entries(col.fields)
        .filter(([_, field]) => field.isComputed);
      const computedFieldDeclaration = computedFields
        .map(([fieldName, field]) => `${fieldName}?: ${getDataTypeString(field, fieldName, colName, schema)};`)
        .join('\n');
      const computedFieldType = computedFields
        .map(([fieldName, field]) => `${fieldName}?: ${getDataTypeString(field, fieldName, colName, schema)},`)
        .join('\n');
      const computedFieldAssignment = computedFields
        .map(([fieldName, _]) => `this.${fieldName} = arg?.${fieldName};`)
        .join('\n');
      const computedFieldReturn = computedFields
        .map(([fieldName, _]) => `if(this.${fieldName}){data.${fieldName}= this.${fieldName};}`)
        .join('\n');
      const isNonComputedSameVars = Object.entries(col.fields)
        .map(([fieldName, field]) => {
          const varName = `${fieldName}:`;
          if (computedFields.map(([fieldName, _]) => fieldName).includes(fieldName)) {
            return `${varName} true`;
          }
          if (modules.every(module => module.isPrimitive ? module.isPrimitive(field) : true)) {
            return `${varName} before?.${fieldName} === after?.${fieldName}`
          }
          return `${varName} before?.${fieldName}  ? after?.${fieldName} ? before.${fieldName}.isEqual(after.${fieldName}):  false :after?.${fieldName} ?false: true`
        })
        .join(',\n');
      return computedFieldString(
        colName,
        computedFieldDeclaration,
        computedFieldType,
        computedFieldAssignment,
        computedFieldReturn,
        isNonComputedSameVars,
      );
    })
    .join('\n');
  const finalContent = schemaContent + computedSchemaContent;
  const modelFileContent = prettier.format(schemaString(finalContent), { parser: "typescript" });
  fs.writeFileSync(path.join(outputFilePath, 'models.ts'), modelFileContent);

}

function computedFieldString(
  colName: string,
  fieldDeclaration: string,
  fieldType: string,
  fieldAssignment: string,
  fieldReturn: string,
  isNonComputedSameVars: string,
): string {
  const pascal = getPascalCollectionName(colName);
  return `
export class Computed${pascal} extends Computed {
  collection: string;
  document!: ${pascal};
  ${fieldDeclaration}
  constructor(arg?: {
    ${fieldType}
  }) {
    super();
    this.collection = '${colName}';
    ${fieldAssignment}
  }

  toMap() {
    const data: { [fieldName: string]: any } = {};
    ${fieldReturn}
    return data;
  }

  isNonComputedSame<K extends keyof ${pascal}>(before: ${pascal}, after: ${pascal}, keys: K[]) {
    const isValueSame = {
    ${isNonComputedSameVars}
    };
    return keys.some(key => !isValueSame[key])
  }
  }
  `
}

function fieldString(colName: string, attributes: string): string {
  return `
    export interface ${getPascalCollectionName(colName)} {
    ${attributes}
  }
  `
}

function schemaString(schemaContent: string): string {
  return `
import { firestore } from 'firebase-admin';
import { Computed } from "./utils";
${schemaContent}
`
}


function getDataTypeString(
  field: Field, fieldName: string, collectionName: string, schema: FlamestoreSchema): string {
  const typeMap: Record<FieldTypes, string> = {
    [FieldTypes.STRING]: 'string',
    [FieldTypes.DATETIME]: 'firestore.Timestamp',
    [FieldTypes.INT]: 'number',
    [FieldTypes.FLOAT]: 'number',
    [FieldTypes.PATH]: 'firestore.DocumentReference',
  }
  return typeMap[getFieldType(field, fieldName, collectionName, schema)];
}
