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
import { useFlamestoreUtils } from "flamestore";

export const functions = _functions.region("${schema.region}");
export const {
  foundDuplicate,
  syncField,
  computeDocument,
  allSettled,
  update,
  serverTimestamp,
  increment,
} = useFlamestoreUtils(firestore, functions);
`;
}
