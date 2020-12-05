import * as prettier from 'prettier';
import * as fs from 'fs';
import * as path from 'path';
import { FlamestoreSchema } from '../type';

export default function generateUtils(dir: string, schema: FlamestoreSchema) {
  const content = utilStringOfSchema(schema);
  const triggerFileContent = prettier.format(content, { parser: "typescript" });
  fs.writeFileSync(path.join(dir, `utils.ts`), triggerFileContent);
}


function utilStringOfSchema(schema: FlamestoreSchema): string {
  return `import { ProjectConfiguration, flamestoreUtils } from 'flamestore';
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin"
export const serverTimestamp = firestore.FieldValue.serverTimestamp;
export const increment = firestore.FieldValue.increment;
export const functions = _functions.region("${schema.configuration.region}");
const projectId:string = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const projects: { [name: string]: ProjectConfiguration } = ${JSON.stringify(schema.configuration.project)};
const flamestore = flamestoreUtils(projects[projectId], firestore(), functions);
export const { foundDuplicate, syncField, createDynamicLink } = flamestore;
export const ComputeDocument = flamestore.computeDocumentFactory();
`
}