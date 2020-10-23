/* tslint:disable */
import * as _functions from "firebase-functions";
import { firestore } from "firebase-admin";
import {
  foundDuplicate,
  allSettled,
  updateIfNotEmpty,
  increment,
  syncField,
} from "./utils";
import { User, Tweet, Like } from "./model";

const functions = _functions.region("asia-southeast2");

export const onTweetCreate = functions.firestore
  .document("/tweets/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;

    const [refusersDataSnapshot] = await Promise.all([data.user.get()]);
    const refusersData = refusersDataSnapshot.data() as User;

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.likesSum = 0;
    snapshotRefData.userName = refusersData.userName;
    snapshotRefData.creationTime = firestore.FieldValue.serverTimestamp();

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(1);

    await allSettled([
      updateIfNotEmpty(snapshot.ref, snapshotRefData),
      updateIfNotEmpty(data.user, userData),
    ]);
  });

export const onTweetDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(-1);

    await updateIfNotEmpty(data.user, userData);
  });
