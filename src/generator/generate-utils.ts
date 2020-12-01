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
  return `import { ProjectConfiguration } from 'flamestore';
export const serverTimestamp = firestore.FieldValue.serverTimestamp;
export const increment = firestore.FieldValue.incremen
const projectId = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const projects: { [name: string]: ProjectConfiguration } = ${JSON.stringify(schema.configuration.project)};
const flamestore = yo(projects[projectId], firestore(), functions);
export const { foundDuplicate, syncField, createDynamicLink } = flamestore;
export const ComputeDocument = flamestore.factory();
`
}