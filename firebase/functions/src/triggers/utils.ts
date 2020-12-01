import { ProjectConfiguration, yo } from "flamestore";
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin"

export const functions = _functions.region("asia-southeast2");
const projectId: string = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const projects: { [name: string]: ProjectConfiguration } = {
  flamestore: {
    apiKey: "AIzaSyB5fXsc7xYmMA2_qH7jnVgF9OYEaBSjUBU",
    domain: "flamestore.web.app",
    dynamicLinkDomain: "flamestore.page.link",
    androidPackageName: "com.example.flamestore_example",
  },
};
const flamestore = yo(projects[projectId], firestore(), functions);
export const { foundDuplicate, syncField, createDynamicLink } = flamestore;
export const ComputeDocument = flamestore.factory();