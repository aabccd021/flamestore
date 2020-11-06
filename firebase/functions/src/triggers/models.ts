import { firestore } from "firebase-admin";
import { Computed } from "./utils";

export interface User {
  uid: string;
  userName: string;
  bio?: string;
  tweetsCount?: number;
}

export interface Tweet {
  user: firestore.DocumentReference;
  userName?: string;
  tweetText: string;
  likesSum?: number;
  creationTime?: firestore.Timestamp;
  hotness?: number;
}

export interface Like {
  likeValue: number;
  user: firestore.DocumentReference;
  tweet: firestore.DocumentReference;
}

export class ComputedTweet extends Computed {
  collection: string;
  document!: Tweet;
  hotness?: number;
  constructor(arg?: { hotness?: number }) {
    super();
    this.collection = "tweets";
    this.hotness = arg?.hotness;
  }

  toMap() {
    return {
      hotness: this.hotness,
    };
  }

  isNonComputedSame(before: Tweet, after: Tweet) {
    const userIsEqual = before?.user?.isEqual
      ? after?.user
        ? before.user.isEqual(after.user)
        : false
      : after?.user
      ? false
      : true;
    const userNameIsEqual = before?.userName === after?.userName;
    const tweetTextIsEqual = before?.tweetText === after?.tweetText;
    const likesSumIsEqual = before?.likesSum === after?.likesSum;
    const creationTimeIsEqual = before?.creationTime?.isEqual
      ? after?.creationTime
        ? before.creationTime.isEqual(after.creationTime)
        : false
      : after?.creationTime
      ? false
      : true;
    return (
      userIsEqual &&
      userNameIsEqual &&
      tweetTextIsEqual &&
      likesSumIsEqual &&
      creationTimeIsEqual
    );
  }
}
