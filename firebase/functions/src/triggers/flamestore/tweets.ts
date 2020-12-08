import { allSettled, update } from "flamestore";
import { ITweet, IUser } from "../models";
import {
  functions,
  increment,
  serverTimestamp,
} from "../utils";

export const onCreate = functions.firestore
  .document("/tweets/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as ITweet;

    const [refusersDataSnapshot] = await Promise.all([
      data.user.reference.get(),
    ]);
    const refusersData = refusersDataSnapshot.data() as IUser;

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.user = { ...snapshotRefData?.user, userName: refusersData.userName };
    snapshotRefData.likesSum = 0;
    snapshotRefData.creationTime = serverTimestamp();

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(1);

    await allSettled([
      update(snapshot.ref, snapshotRefData),
      update(data.user.reference, userData),
    ]);
  });

export const onDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as ITweet;

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(-1);

    await update(data.user.reference, userData);
  });
