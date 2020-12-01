/* tslint:disable */
import { functions } from "../utils";
import { firestore } from "firebase-admin";
import {
  foundDuplicate,
  syncField,
} from "../utils";
import {
  serverTimestamp,
  allSettled,
  update,
  increment,
} from "flamestore";
import { User, Tweet, Like } from "../models";

export const onCreate = functions.firestore
  .document("/likes/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(data.likeValue);

    await update(data.tweet, tweetData);
  });

export const onUpdate = functions.firestore
  .document("/likes/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Like;
    const after = change.after.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    if (after.likeValue !== before.likeValue) {
      tweetData.likesSum = firestore.FieldValue.increment(after.likeValue - before.likeValue);
    }

    await update(after.tweet, tweetData);
  });

export const onDelete = functions.firestore
  .document("/likes/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(-data.likeValue);

    await update(data.tweet, tweetData);
  });
