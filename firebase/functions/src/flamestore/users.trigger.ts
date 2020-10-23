/* tslint:disable */
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin";
import {
  foundDuplicate,
  allSettled,
  updateIfNotEmpty,
  increment,
  syncField,
} from "./utils.flamestore";
import { User, Tweet, Like } from "./model.flamestore";

const functions = _functions.region("asia-southeast2");

export const onUserCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as User;

    if (await foundDuplicate("users", "userName", snapshot, context)) return;

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.tweetsCount = 0;

    await updateIfNotEmpty(snapshot.ref, snapshotRefData);
  });

export const onUserUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as User;
    const after = change.after.data() as User;

    if (await foundDuplicate("users", "userName", change, context)) return;

    const tweetsUserData: { [fieldName: string]: any } = {};
    if (after.userName !== before.userName) {
      tweetsUserData.userName = after.userName;
    }

    await syncField("tweets", "user", change.after.ref, tweetsUserData);
  });
