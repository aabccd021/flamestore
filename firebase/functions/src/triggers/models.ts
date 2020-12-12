import { firestore } from "firebase-admin";
import { onCreateFn, onUpdateFn } from "flamestore/lib";
import { computeDocument } from "./utils";

export interface User {
  userName: string;
  bio?: string;
  tweetsCount?: number;
  uid: string;
}

export interface Tweet {
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

export interface Like {
  likeValue: number;
  tweet: {
    reference: firestore.DocumentReference;
  };
  user: {
    reference: firestore.DocumentReference;
  };
}

type TweetComputedFields = "hotness";
type ComputedTweet = Omit<Tweet, TweetComputedFields>;
type NonComputedTweet = Pick<Tweet, TweetComputedFields>;

export function computeTweet<D extends keyof ComputedTweet>({
  computeOnCreate,
  computeOnUpdate,
  dependencyFields,
}: {
  computeOnCreate: onCreateFn<ComputedTweet, NonComputedTweet>;
  computeOnUpdate: onUpdateFn<Pick<ComputedTweet, D>, NonComputedTweet>;
  dependencyFields: D[];
}) {
  return computeDocument({
    computeOnCreate,
    computeOnUpdate,
    dependencyFields: dependencyFields,
    computedFields: ["hotness"],
    collection: "tweets",
  });
}
