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
    const [tweetUserDataSnapshot] = await Promise.all([
      data.user.reference.get(),
    ]);
    const tweetUserData = tweetUserDataSnapshot.data() as User;
    const tweetData = {
      user: { userName: tweetUserData.userName },
      likesSum: 0,
      creationTime: serverTimestamp(),
      image: await imageDataOf(
        "tweets",
        "image",
        data.user.reference.id,
        ["height", "width"],
        snapshot
      ),
    };
    const userData = { tweetsCount: increment(1) };
    await allSettled([
      update(snapshot.ref, tweetData),
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
