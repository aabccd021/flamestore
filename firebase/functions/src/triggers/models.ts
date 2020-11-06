import { firestore } from "firebase-admin";
import { Computed } from "flamestore";

export interface User {
  uid: string;
  userName: string;
  bio: string;
  tweetsCount: number;
}

export interface Tweet {
  user: firestore.DocumentReference;
  userName: string;
  tweetText: string;
  likesSum: number;
  creationTime: firestore.Timestamp;
  hotness: number;
}

export interface Like {
  likeValue: number;
  user: firestore.DocumentReference;
  tweet: firestore.DocumentReference;
}


