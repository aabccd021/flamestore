// export * as users from "./users";
// export * as tweets from "./tweets";
// export * as likes from "./likes";
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";

export const testTrigger = functions.firestore
  .document("posts/{doc}")
  .onCreate((change, context) => {
    console.log("!!! Triggered added post 'onCreate' !!!");
    return firestore().collection("stats").add({ title: "trigger works!" });
  });