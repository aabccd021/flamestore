import * as prettier from "prettier";
import * as path from "path";
import { FlamestoreSchema } from "../type";
import { writePrettyFile } from "./util";

export default function generateUtils(
  dir: string,
  schema: FlamestoreSchema
): void {
  const content = utilStringOfSchema(schema);
  const triggerFileContent = prettier.format(content, { parser: "typescript" });
  writePrettyFile(path.join(dir, `utils.ts`), triggerFileContent);
}

function utilStringOfSchema(schema: FlamestoreSchema): string {
  return `import { firestore } from "firebase-admin";
import * as _functions from "firebase-functions";
import { flamestoreUtils, ProjectConfiguration } from "flamestore";

export const serverTimestamp = firestore.FieldValue.serverTimestamp;
export const increment = firestore.FieldValue.increment;
export const functions = _functions.region("${schema.region}");
const projectId:string = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const projects: { [name: string]: ProjectConfiguration } = ${JSON.stringify(
    schema.project
  )};
const flamestore = flamestoreUtils(projects[projectId], firestore(), functions);
export const { foundDuplicate, syncField  } = flamestore;
export const ComputeDocument = flamestore.computeDocumentFactory();
`;
}
