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

const tweetComputeFieldss = ["hotness"] as const;
type TweetC = typeof tweetComputeFieldss[number];
export function computeTweet<D extends keyof Omit<Tweet, TweetC>>({
  dependencyFields,
  computeOnCreate,
  computeOnUpdate,
}: {
  dependencyFields: D[];
  computeOnCreate: onCreateFn<Tweet, TweetC>;
  computeOnUpdate: onUpdateFn<Tweet, TweetC, D>;
}) {
  return computeDocument<Tweet, TweetC, D>(
    "tweets",
    tweetComputeFieldss,
    dependencyFields,
    computeOnCreate,
    computeOnUpdate
  );
}
