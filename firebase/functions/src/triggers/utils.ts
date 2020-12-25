import { firestore, storage } from "firebase-admin";
import * as _functions from "firebase-functions";
import { useFlamestoreUtils } from "flamestore";

export const functions = _functions.region("asia-southeast2");
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
