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
    log(`Update ${snapshot.ref.id}`, { updateData: snapshotRefData });
    return Promise.all(
      [
        ...(Object.keys(snapshotRefData).length > 0
          ? [snapshot.ref.update(snapshotRefData)]
          : []),
      ].map(handleError)
    );
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
    return Promise.all(
      [queryUpdate("tweets", "user", snapshot.after.ref, tweetsUserData)].map(
        handleError
      )
    );
  });

export const onTweetCreate = functions.firestore
  .document("/tweets/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;
    const snapshotRefData: { [fieldName: string]: any } = {};
    snapshotRefData.likesSum = 0;
    snapshotRefData.creationTime = firestore.FieldValue.serverTimestamp;
    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(1);
    log(`Update ${snapshot.ref.id}`, { updateData: snapshotRefData });
    log(`Update ${data.user.id}`, { updateData: userData });
    return Promise.all(
      [
        ...(Object.keys(snapshotRefData).length > 0
          ? [snapshot.ref.update(snapshotRefData)]
          : []),
        ...(Object.keys(userData).length > 0
          ? [data.user.update(userData)]
          : []),
      ].map(handleError)
    );
  });

export const onTweetDelete = functions.firestore
  .document("/tweets/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Tweet;
    const userData: { [fieldName: string]: any } = {};
    userData.tweetsCount = increment(-1);
    log(`Update ${data.user.id}`, { updateData: userData });
    return Promise.all(
      [
        ...(Object.keys(userData).length > 0
          ? [data.user.update(userData)]
          : []),
      ].map(handleError)
    );
  });

export const onLikeCreate = functions.firestore
  .document("/likes/{documentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as Like;
    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(data.likeValue);
    log(`Update ${data.tweet.id}`, { updateData: tweetData });
    return Promise.all(
      [
        ...(Object.keys(tweetData).length > 0
          ? [data.tweet.update(tweetData)]
          : []),
      ].map(handleError)
    );
  });

export const onLikeUpdate = functions.firestore
  .document("/likes/{documentId}")
  .onUpdate(async (snapshot, context) => {
    const before = snapshot.before.data() as Like;
    const after = snapshot.after.data() as Like;
    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(after.likeValue - before.likeValue);
    log(`Update ${after.tweet.id}`, { updateData: tweetData });
    return Promise.all(
      [
        ...(Object.keys(tweetData).length > 0
          ? [after.tweet.update(tweetData)]
          : []),
      ].map(handleError)
    );
  });

export const onLikeDelete = functions.firestore
  .document("/likes/{documentId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data() as Like;
    const tweetData: { [fieldName: string]: any } = {};
    tweetData.likesSum = increment(-data.likeValue);
    log(`Update ${data.tweet.id}`, { updateData: tweetData });
    return Promise.all(
      [
        ...(Object.keys(tweetData).length > 0
          ? [data.tweet.update(tweetData)]
          : []),
      ].map(handleError)
    );
  });

const log = (name: string, value: any) => {
  if (Object.keys(value).length !== 0) {
    functions.logger.log(name, value);
  }
};
const warn = functions.logger.warn;
const handleError = (p: Promise<any>) => p.catch((_) => null);
const increment = firestore.FieldValue.increment;
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
  log(
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
