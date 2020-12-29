import * as path from "path";
import { FlameSchema } from "../../type";
import * as fs from "fs";

export default function generateFirebaseUtil(
  dir: string,
  schema: FlameSchema
): void {
  const content = `import { firestore, storage } from "firebase-admin";
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
    `
  fs.writeFileSync(path.join(dir, `utils.ts`),content);
}

