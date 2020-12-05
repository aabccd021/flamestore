import { ProjectConfiguration, flamestoreUtils } from "flamestore";
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin";
export const serverTimestamp = firestore.FieldValue.serverTimestamp;
export const increment = firestore.FieldValue.increment;
export const functions = _functions.region("asia-southeast2");
const projectId: string = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const projects: { [name: string]: ProjectConfiguration } = {
  flamestore: {
    dynamicLinkDomain: "flamestore.page.link",
    androidPackageName: "com.example.flamestore_example",
  },
};
const flamestore = flamestoreUtils(projects[projectId], firestore(), functions);
export const { foundDuplicate, syncField } = flamestore;
export const ComputeDocument = flamestore.computeDocumentFactory();
