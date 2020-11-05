import { Field, FieldTypes, FlamestoreSchema } from "./type";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { getPascalCollectionName, getFieldType } from "./util";


export function generateSchema(outputFilePath: string, schema: FlamestoreSchema) {

  const schemaContent = Object.entries(schema.collections)
    .map(([colName, col]) => {
      const attributes =
        Object.entries(col.fields)
          .map(([fieldName, field]) => `${fieldName}: ${getDataTypeString(field, fieldName, colName, schema)};`)
          .join('\n');
      return fieldString(colName, attributes);
    })
    .join('\n');
  const modelFileContent = prettier.format(schemaString(schemaContent), { parser: "typescript" });
  fs.writeFileSync(path.join(outputFilePath, 'models.ts'), modelFileContent);

}

function fieldString(colName: string, attributes: string): string {
  return `
    export interface ${getPascalCollectionName(colName)} {
    ${attributes}
  }
  `
}

function schemaString(schemaContent: string): string {
  return `/* tslint:disable */
import { firestore } from 'firebase-admin';
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
