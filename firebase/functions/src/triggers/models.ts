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
  image?: {
    url?: string;
    height?: number;
    width?: number;
  };
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

const tweetsComputeFields = ["hotness"] as const;
type TweetC = typeof tweetsComputeFields[number];
export function computeTweet<D extends keyof Omit<Tweet, TweetC>>({
  dependencyFields,
  onCreate,
  onUpdate,
}: {
  dependencyFields: D[];
  onCreate: onCreateFn<Tweet, TweetC>;
  onUpdate: onUpdateFn<Tweet, TweetC, D>;
}) {
  return computeDocument(
    "tweets",
    tweetsComputeFields,
    dependencyFields,
    onCreate,
    onUpdate
  );
}
