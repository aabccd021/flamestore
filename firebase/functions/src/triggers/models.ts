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
    const data: { [fieldName: string]: any } = {};
    if (this.hotness) {
      data.hotness = this.hotness;
    }
    return data;
  }

  isNonComputedSame<K extends keyof Tweet>(
    before: Tweet,
    after: Tweet,
    keys: K[]
  ) {
    const isValueSame = {
      user: before?.user
        ? after?.user
          ? before.user.isEqual(after.user)
          : false
        : after?.user
        ? false
        : true,
      userName: before?.userName === after?.userName,
      tweetText: before?.tweetText === after?.tweetText,
      likesSum: before?.likesSum === after?.likesSum,
      creationTime: before?.creationTime
        ? after?.creationTime
          ? before.creationTime.isEqual(after.creationTime)
          : false
        : after?.creationTime
        ? false
        : true,
      hotness: true,
    };
    return keys.some((key) => !isValueSame[key]);
  }
}
