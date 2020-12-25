import { User, Tweet } from "../models";
import {
  functions,
  increment,
  serverTimestamp,
  allSettled,
  update,
  imageDataOf,
} from "../utils";

export const onCreate = functions.firestore
  .document("/tweets/{documentId}")
  .onCreate(async (snapshot) => {
    const data = snapshot.data() as Tweet;
    const [refusersDataSnapshot] = await Promise.all([
      data.user.reference.get(),
    ]);
    const refusersData = refusersDataSnapshot.data() as User;
    const snapshotRefData = {
      user: { userName: refusersData.userName },
      likesSum: 0,
      creationTime: serverTimestamp(),
      image: await imageDataOf(
        "tweets",
        "image",
        data.user.reference.id,
        ["height", "width"],
        snapshot,
      ),
    };
    const userData = { tweetsCount: increment(1) };
    await allSettled([
      update(snapshot.ref, snapshotRefData),
      update(data.user.reference, userData),
    ]);
  });

export const onDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot) => {
    const data = snapshot.data() as Tweet;
    const userData = { tweetsCount: increment(-1) };
    await update(data.user.reference, userData);
  });
