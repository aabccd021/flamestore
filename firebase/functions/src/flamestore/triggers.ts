/* tslint:disable */
import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";

interface User {
  uid: string;
  userName: string;
  bio: string;
  tweetsCount: number;
}

interface Tweet {
  user: firestore.DocumentReference;
  userName: string;
  tweetText: string;
  likesSum: number;
  creationTime: firestore.Timestamp;
}

interface Like {
  likeValue: number;
  user: firestore.DocumentReference;
  tweet: firestore.DocumentReference;
}

export const onUserCreate = functions.firestore
  .document("/users/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as User;

    const userNameDuplicates = await firestore()
      .collection("users")
      .where("userName", "==", data.userName)
      .get();
    if (userNameDuplicates.docs.length > 1) {
      warn("Duplicate userName created on users", { snapshot, context });
      return snapshot.ref.delete();
    }

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.tweetsCount = 0;

    return allSettled([...updateIfNotEmpty(snapshot.ref, snapshotRefData)]);
  });

export const onUserUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (snapshot, context) => {
    const before = snapshot.before.data() as User;
    const after = snapshot.after.data() as User;

    const userNameDuplicates = await firestore()
      .collection("users")
      .where("userName", "==", after.userName)
      .get();
    if (userNameDuplicates.docs.length > 1) {
      warn("Duplicate userName updated on users.", { snapshot, context });
      return snapshot.before.ref.update({ userName: before.userName });
    }

    const tweetsUserData: { [fieldName: string]: any } = {};
    if (after.userName !== before.userName) {
      tweetsUserData.userName = after.userName;
    }

    return allSettled([
      queryUpdate("tweets", "user", snapshot.after.ref, tweetsUserData),
    ]);
  });

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

    return allSettled([
      ...updateIfNotEmpty(snapshot.ref, snapshotRefData),
      ...updateIfNotEmpty(data.user, userData),
    ]);
  });

export const onTweetDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;

    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(-1);

    return allSettled([...updateIfNotEmpty(data.user, userData)]);
  });

export const onLikeCreate = functions.firestore
  .document("/likes/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(data.likeValue);

    return allSettled([...updateIfNotEmpty(data.tweet, tweetData)]);
  });

export const onLikeUpdate = functions.firestore
  .document("/likes/{documentId}")
  .onUpdate(async (snapshot, context) => {
    const before = snapshot.before.data() as Like;
    const after = snapshot.after.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(after.likeValue - before.likeValue);

    return allSettled([...updateIfNotEmpty(after.tweet, tweetData)]);
  });

export const onLikeDelete = functions.firestore
  .document("/likes/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Like;

    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(-data.likeValue);

    return allSettled([...updateIfNotEmpty(data.tweet, tweetData)]);
  });

const warn = functions.logger.warn;
const allSettled = (promises: Promise<any>[]): Promise<any> => {
  return Promise.all(promises.map((p) => p.catch((_) => null)));
};
const increment = firestore.FieldValue.increment;
const updateIfNotEmpty = (
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
): Promise<firestore.WriteResult>[] => {
  functions.logger.log(`Update ${ref.id}`, { data: data });
  if (Object.keys(data).length > 0) {
    return [ref.update(data)];
  }
  return [];
};
const queryUpdate = async (
  collection: string,
  refField: string,
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
) => {
  if (Object.keys(data).length === 0) {
    return;
  }
  const querySnapshot = await firestore()
    .collection(collection)
    .where(refField, "==", ref)
    .get();
  const results = await Promise.all(
    querySnapshot.docs.map((doc) =>
      doc.ref
        .update(data)
        .then((_) => "")
        .catch((__) => `${doc.ref.id}`)
    )
  );
  const filteredResult = results.filter((result) => result !== "");
  functions.logger.log(
    `Update where ${collection}.${refField}.id == ${ref.id} success on ${
      results.length - filteredResult.length
    } documents`,
    { updateData: data }
  );
  if (filteredResult.length > 0) {
    warn(
      `Update where ${collection}.${refField}== ${ref.id} fail on ${filteredResult.length} documents`,
      { documentIds: filteredResult }
    );
  }
};
