import * as path from "path";
import * as fs from "fs";
import { FirebaseRegion } from "../schema-processor/schema-types";

export default function generateFirebaseUtil(
  dir: string,
  region: FirebaseRegion
): void {
  const content = `import { firestore, storage } from "firebase-admin";
    import * as _functions from "firebase-functions";
    import { useFlamestoreUtils } from "flamestore";

    export const functions = _functions.region("${region}");
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
  fs.writeFileSync(path.join(dir, `utils.ts`), content);
}
