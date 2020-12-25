import { User } from "../models";
import {
  foundDuplicate,
  functions,
  imageDataOf,
  syncField,
  update,
  useOnImageUploaded,
} from "../utils";
// import path from "path";

export const onCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    if (await foundDuplicate("users", "userName", snapshot, context)) return;
    const snapshotRefData = {
      tweetsCount: 0,
    };
    await update(snapshot.ref, snapshotRefData);
  });

export const onUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as User;
    const after = change.after.data() as User;
    if (await foundDuplicate("users", "userName", change, context)) return;
    const tweetsUserData = {
      user: {
        userName: after.userName !== before.userName ? after.userName : null,
      },
    };
    await syncField("tweets", "user", change, tweetsUserData);
  });

export const onImageUploaded = useOnImageUploaded("users", "image", [
  "height",
  "width",
]);
