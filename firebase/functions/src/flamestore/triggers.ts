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

    if (await foundDuplicate("users", "userName", snapshot, context)) return;

    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.tweetsCount = 0;

    return allSettled([...updateIfNotEmpty(snapshot.ref, snapshotRefData)]);
  });

export const onUserUpdate = functions.firestore
  .document("/users/{documentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as User;
    const after = change.after.data() as User;

    if (await foundDuplicate("users", "userName", change, context)) return;

    const tweetsUserData: { [fieldName: string]: any } = {};
    if (after.userName !== before.userName) {
      tweetsUserData.userName = after.userName;
    }

    return allSettled([
      queryUpdate("tweets", "user", change.after.ref, tweetsUserData),
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
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Like;
    const after = change.after.data() as Like;

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

const foundDuplicate = async (
  collectionName: string,
  fieldName: string,
  snapshotOrChange:
    | functions.firestore.QueryDocumentSnapshot
    | functions.Change<functions.firestore.QueryDocumentSnapshot>,
  context: functions.EventContext
): Promise<boolean> => {
  function isSnapshot(
    value:
      | functions.firestore.QueryDocumentSnapshot
      | functions.Change<functions.firestore.QueryDocumentSnapshot>
  ): value is functions.firestore.QueryDocumentSnapshot {
    return !value.hasOwnProperty("after");
  }
  const snapshot = isSnapshot(snapshotOrChange)
    ? snapshotOrChange
    : snapshotOrChange.after;
  const duplicates = await firestore()
    .collection(collectionName)
    .where(fieldName, "==", snapshot.data()[fieldName])
    .get();
  if (duplicates.docs.length > 1) {
    functions.logger.warn(
      `Duplicate ${fieldName} created on ${collectionName}`,
      { snapshot, context }
    );
    if (isSnapshot(snapshotOrChange)) {
      await snapshotOrChange.ref.delete();
    } else {
      await snapshotOrChange.before.ref.update({
        [fieldName]: snapshotOrChange.before.data()[fieldName],
      });
    }
    return true;
  }
  return false;
};
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
    functions.logger.warn(
      `Update where ${collection}.${refField}== ${ref.id} fail on ${filteredResult.length} documents`,
      { documentIds: filteredResult }
    );
  }
};
