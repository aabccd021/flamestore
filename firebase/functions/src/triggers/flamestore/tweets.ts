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
    const [tweetOwnerDataSnapshot] = await Promise.all([
      data.owner.reference.get(),
    ]);
    const tweetOwnerData = tweetOwnerDataSnapshot.data() as User;
    const tweetData = {
      owner: { userName: tweetOwnerData.userName },
      likesSum: 0,
      creationTime: serverTimestamp(),
      image: await imageDataOf(
        "tweets",
        "image",
        data.owner.reference.id,
        ["height", "width"],
        snapshot
      ),
    };
    const ownerData = { tweetsCount: increment(1) };
    await allSettled([
      update(snapshot.ref, tweetData),
      update(data.owner.reference, ownerData),
    ]);
  });

export const onDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot) => {
    const data = snapshot.data() as Tweet;
    const ownerData = { tweetsCount: increment(-1) };
    await update(data.owner.reference, ownerData);
  });
