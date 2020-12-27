import { User } from "../models";
import { foundDuplicate, functions, syncField, update } from "../utils";
export const onCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    if (await foundDuplicate("users", "userName", snapshot, context)) return;
    const snapshotRefData = { tweetsCount: 0 };
    await update(snapshot.ref, snapshotRefData);
  });

export const onUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (snapshot, context) => {
    const before = snapshot.before.data() as User;
    const after = snapshot.after.data() as User;
    if (await foundDuplicate("users", "userName", snapshot, context)) return;
    const tweetsUserData = {
      user: {
        userName: after.userName !== before.userName ? after.userName : null,
      },
    };
    await syncField("tweets", "user", snapshot, tweetsUserData);
  });
