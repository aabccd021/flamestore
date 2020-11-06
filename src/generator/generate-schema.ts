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
      const nonComputedFields = Object.entries(col.fields)
        .filter(([_, field]) => !field?.isComputed);
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
        .map(([fieldName, _]) => `${fieldName}: this.${fieldName},`)
        .join('\n');
      const isNonComputedSameVars = nonComputedFields
        .map(([fieldName, field]) => {
          const varName = `const ${fieldName}IsEqual =`;
          if (modules.every(module => module.isPrimitive ? module.isPrimitive(field) : true)) {
            return `${varName} before?.${fieldName} === after?.${fieldName};`
          }
          return `${varName} before?.${fieldName}?.isEqual  ? after?.${fieldName} ? before.${fieldName}.isEqual(after.${fieldName}):  false :after?.${fieldName} ?false: true;`
        })
        .join('\n');
      const isNonComputedSame = nonComputedFields.map(([fieldName, _]) => `${fieldName}IsEqual`).join(' && ');
      return computedFieldString(
        colName,
        computedFieldDeclaration,
        computedFieldType,
        computedFieldAssignment,
        computedFieldReturn,
        isNonComputedSameVars,
        isNonComputedSame,
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
  isNonComputedSame: string,
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
    return {
      ${fieldReturn}
    }
  }

  isNonComputedSame(before: ${pascal}, after: ${pascal}) {
    ${isNonComputedSameVars}
    return ${isNonComputedSame};
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
