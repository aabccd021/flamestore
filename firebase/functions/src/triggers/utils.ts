import { firestore } from "firebase-admin";
import * as _functions from "firebase-functions";
import { useFamestoreUtils } from "flamestore";

export const functions = _functions.region("asia-southeast2");
export const {
  foundDuplicate,
  syncField,
  computeDocument,
  allSettled,
  update,
  serverTimestamp,
  increment,
} = useFamestoreUtils(firestore, functions);
