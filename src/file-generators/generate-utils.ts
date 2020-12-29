import * as path from "path";
import { FlamestoreSchema } from "../type";
import * as fs from "fs";

export default function generateUtils(
  dir: string,
  schema: FlamestoreSchema
): void {
  fs.writeFileSync(path.join(dir, `utils.ts`), utilStringOfSchema(schema));
}

function utilStringOfSchema(schema: FlamestoreSchema): string {
  return `import { firestore, storage } from "firebase-admin";
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
  useOnImageUploaded,
  imageDataOf,
} = useFlamestoreUtils(firestore, storage, functions);
`;
}
