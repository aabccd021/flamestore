import { update } from "flamestore";
import { IUser } from "../models";
import {
  foundDuplicate,
  functions,
  syncField,
} from "../utils";

export const onCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    if (await foundDuplicate("users", "userName", snapshot, context)) { return; }

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.tweetsCount = 0;

    await update(snapshot.ref, snapshotRefData);
  });

export const onUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as IUser;
    const after = change.after.data() as IUser;

    if (await foundDuplicate("users", "userName", change, context)) { return; }

    const tweetsUserData: { [fieldName: string]: any } = {};
    if (after.userName !== before.userName) {
      tweetsUserData.user = { ...tweetsUserData.user, userName: after.userName };
    }

    await syncField("tweets", "user", change.after.ref, tweetsUserData);
  });
