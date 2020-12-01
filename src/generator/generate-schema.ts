import { FieldType, FieldTypes, FlamestoreModule, FlamestoreSchema } from "../type";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { getPascalCollectionName, getFieldType, isComputed, isOptional } from "./util";


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
            const mustExists = modules.some(module => {
              if (isOptional(field)) {
                return false;
              }
              if (module.isCreatable) {
                return module.isCreatable(field);
              }
              return false;
            });
            let override = undefined;
            for (const module of modules) {
              if (module.isCreatableOverride) {
                const creatableOverride = module.isCreatableOverride(field);
                if (creatableOverride !== undefined) {
                  override = creatableOverride;
                }
              }
            }
            const finalMustExists = override !== undefined ? override : mustExists;
            const question = finalMustExists ? '' : '?';
            return `${fieldName}${question}: ${getDataTypeString(field.type, fieldName, colName, schema)};`
          })
          .join('\n');
      return fieldString(colName, attributes);
    })
    .join('\n');
  const computedSchemaContent = Object.entries(schema.collections)
    .filter(([_, col]) => Object.values(col.fields).some(f => isComputed(f)))
    .map(([colName, col]) => {
      const computedFields = Object.entries(col.fields)
        .filter(([_, field]) => isComputed(field));
      const computedFieldDeclaration = computedFields
        .map(([fieldName, field]) => `${fieldName}?: ${getDataTypeString(field.type, fieldName, colName, schema)};`)
        .join('\n');
      const computedFieldType = computedFields
        .map(([fieldName, field]) => `${fieldName}?: ${getDataTypeString(field.type, fieldName, colName, schema)},`)
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

  isDependencyChanged<K extends keyof ${pascal}>(before: ${pascal}, after: ${pascal}, keys: K[]) {
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
import { Computed } from "flamestore";
${schemaContent}
`
}


function getDataTypeString(
  type: FieldType, fieldName: string, collectionName: string, schema: FlamestoreSchema): string {
  const typeMap: Record<FieldTypes, string> = {
    [FieldTypes.STRING]: 'string',
    [FieldTypes.DATETIME]: 'firestore.Timestamp',
    [FieldTypes.INT]: 'number',
    [FieldTypes.FLOAT]: 'number',
    [FieldTypes.PATH]: 'firestore.DocumentReference',
  }
  return typeMap[getFieldType(type, fieldName, collectionName, schema)];
}
