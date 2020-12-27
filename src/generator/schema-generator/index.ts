import { FlamestoreSchema } from "../../type";
import * as path from "path";
import * as fs from "fs";
import { getNonComputedSchemaString } from "./non-computed-schema-generator";
import { getComputedSchemaString } from "./computed-schema-generator";

export function generateSchema(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  const content = getAllSchemaString(schema);
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, content);
}

function getAllSchemaString(schema: FlamestoreSchema): string {
  return `
    import { firestore } from 'firebase-admin';
    import { onCreateFn, onUpdateFn } from "flamestore/lib";
    import {computeDocument} from "./utils";\n
    ${getNonComputedSchemaString(schema)}\n
    ${getComputedSchemaString(schema)}
    `;
}
