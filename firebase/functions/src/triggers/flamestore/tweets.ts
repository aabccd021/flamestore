/* tslint:disable */
import { functions } from "../functions";
import { firestore } from "firebase-admin";
import {
  foundDuplicate,
  allSettled,
  update,
  syncField,
} from "flamestore";
import { User, Tweet, Like } from "../models";

export const onCreate = functions.firestore
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
    userData.tweetsCount = firestore.FieldValue.increment(1);


    await allSettled([
      update(snapshot.ref, snapshotRefData),
      update(data.user, userData),
    ]);
  });

export const onDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = firestore.FieldValue.increment(-1);

    await update(data.user, userData);
  });
