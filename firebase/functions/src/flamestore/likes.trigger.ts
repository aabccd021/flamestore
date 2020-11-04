/* tslint:disable */
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin";
import {
  foundDuplicate,
  allSettled,
  update,
  increment,
  syncField,
} from "flamestore";
import { User, Tweet, Like } from "./model";

const functions = _functions.region("asia-southeast2");

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
    tweetData.likesSum = increment(after.likeValue - before.likeValue);

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
