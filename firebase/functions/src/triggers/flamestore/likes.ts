import { update } from "flamestore";
import { ILike } from "../models";
import {
  functions,
  increment,
} from "../utils";

export const onCreate = functions.firestore
  .document("/likes/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as ILike;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(data.likeValue);

    await update(data.tweet.reference, tweetData);
  });

export const onUpdate = functions.firestore
  .document("/likes/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as ILike;
    const after = change.after.data() as ILike;

    const tweetData: { [fieldName: string]: any } = {};
    if (after.likeValue !== before.likeValue) {
      tweetData.likesSum = increment(after.likeValue - before.likeValue);
    }

    await update(after.tweet.reference, tweetData);
  });

export const onDelete = functions.firestore
  .document("/likes/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as ILike;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(-data.likeValue);

    await update(data.tweet.reference, tweetData);
  });
