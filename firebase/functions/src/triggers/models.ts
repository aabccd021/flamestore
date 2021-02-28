import { onCreateFn, onUpdateFn } from "flamestore/lib";
import { computeDocument } from "./utils";

export type User = {
  userName: string;
  bio?: string;
  tweetsCount?: number;
  uid: string;
};

export interface Tweet {
  owner: {
    reference: FirebaseFirestore.DocumentReference;
    userName?: string;
  };
  tweetText: string;
  likesSum?: number;
  creationTime?: FirebaseFirestore.Timestamp;
  hotness?: number;
  image?: {
    url?: string;
    height?: number;
    width?: number;
  };
  dynamicLink: string;
}

export interface Like {
  user: {
    reference: FirebaseFirestore.DocumentReference;
  };
  likeValue: number;
  tweet: {
    reference: FirebaseFirestore.DocumentReference;
  };
}
const a: User = { userName: "a", uid: "z" };
const z = a as Document;

type Document = { [key: string]: Field };

type Field =
  | ImageField
  | ReferenceField
  | string
  | number
  | FirebaseFirestore.Timestamp
  | undefined;

type ImageField = {
  image?: {
    url?: string;
    height?: number;
    width?: number;
  };
};

type ReferenceField = {
  reference: FirebaseFirestore.DocumentReference;
} & Document;

const tweetsComputeFields = ["hotness"] as const;
type TweetC = typeof tweetsComputeFields[number];
export function computeTweet<D extends keyof Omit<Tweet, TweetC>>(param: {
  dependencyFields: D[];
  onCreate: onCreateFn<Tweet, TweetC>;
  onUpdate: onUpdateFn<Tweet, TweetC, D>;
}) {
  const { dependencyFields, onCreate, onUpdate } = param;
  return computeDocument(
    "tweets",
    tweetsComputeFields,
    dependencyFields,
    onCreate,
    onUpdate
  );
}
