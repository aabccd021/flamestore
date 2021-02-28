import * as admin from "firebase-admin";
admin.initializeApp();
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";

export const testTrigger = functions.firestore
  .document("posts/{doc}")
  .onCreate(async (change, context) => {
    console.log("!!! Triggered added post 'onCreate' !!!");
    const a = await firestore().collection("stats").add({ title: "trigger works!" });
  });