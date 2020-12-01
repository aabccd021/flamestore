/* tslint:disable */
import { functions } from "../utils";
import {
  serverTimestamp,
  foundDuplicate,
  increment,
  syncField,
} from "../utils";
import { allSettled, update } from "flamestore";
import { User, Tweet, Like } from "../models";

export const onCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as User;

    if (await foundDuplicate("users", "userName", snapshot, context)) return;

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.tweetsCount = 0;

    await update(snapshot.ref, snapshotRefData);
  });

export const onUpdate = functions.firestore
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
