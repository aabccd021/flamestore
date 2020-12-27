import { Like } from "../models";
import { functions, increment, update } from "../utils";
export const onCreate = functions.firestore
  .document("/likes/{documentId}")
  .onCreate(async (snapshot) => {
    const data = snapshot.data() as Like;
    const tweetData = { likesSum: increment(data.likeValue) };
    await update(data.tweet.reference, tweetData);
  });

export const onUpdate = functions.firestore
  .document("/likes/{documentId}")
  .onUpdate(async (snapshot) => {
    const before = snapshot.before.data() as Like;
    const after = snapshot.after.data() as Like;
    const tweetData = {
      likesSum:
        before.likeValue !== after.likeValue
          ? increment(after.likeValue - before.likeValue)
          : null,
    };
    await update(after.tweet.reference, tweetData);
  });

export const onDelete = functions.firestore
  .document("/likes/{documentId}")
  .onDelete(async (snapshot) => {
    const data = snapshot.data() as Like;
    const tweetData = { likesSum: increment(-data.likeValue) };
    await update(data.tweet.reference, tweetData);
  });
