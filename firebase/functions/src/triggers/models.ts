import { firestore } from "firebase-admin";
import { Computed } from "flamestore";

export interface IUser {
  userName: string;
  bio?: string;
  tweetsCount?: number;
  uid: string;
}

export interface ITweet {
  user: {
    reference: firestore.DocumentReference;
    userName?: string;
  };
  tweetText: string;
  likesSum?: number;
  creationTime?: firestore.Timestamp;
  hotness?: number;
  dynamicLink: string;
}

export interface ILike {
  likeValue: number;
  tweet: {
    reference: firestore.DocumentReference;
  };
  user: {
    reference: firestore.DocumentReference;
  };
}

export class ComputedTweet extends Computed {
  public collection: string;
  public document!: ITweet;
  private hotness?: number;
  constructor(arg?: { hotness?: number }) {
    super();
    this.collection = "tweets";
    this.hotness = arg?.hotness;
  }

  public toMap() {
    const data: { [fieldName: string]: any } = {};
    if (this.hotness) {
      data.hotness = this.hotness;
    }
    return data;
  }

  public isDependencyChanged<K extends keyof ITweet>(
    before: ITweet,
    after: ITweet,
    keys: K[]
  ) {
    const isValueSame = {
      creationTime: before?.creationTime === after?.creationTime,
      dynamicLink: before?.dynamicLink === after?.dynamicLink,
      hotness: true,
      likesSum: before?.likesSum === after?.likesSum,
      tweetText: before?.tweetText === after?.tweetText,
      user:
        (before?.user?.reference
          ? after?.user?.reference
            ? before.user.reference.isEqual(after.user.reference)
            : false
          : after?.user?.reference
          ? false
          : true) || before?.user?.userName === after?.user?.userName,
    };
    return keys.some((key) => !isValueSame[key]);
  }
}
