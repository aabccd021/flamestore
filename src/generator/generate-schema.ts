import { FlamestoreSchema } from "./schema";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { getPascalCollectionName, getDataTypeString } from "./util";


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


// export function getConstructor(fieldName: string): string {
//   return `this.${fieldName} = snapshot.data().${fieldName}`;
// }

// export function getStaticField(fieldName: string): string {
//   return `static ${fieldName}Key = '${fieldName}';`;
// }

// export function getToString(
//   fieldName: string, field: Field, collectionName: string, schema: FlamestoreSchema): string {
//   return `'${fieldName}': this.${fieldName}${getStringAdaptor(field, fieldName, collectionName, schema)},`;
// }
