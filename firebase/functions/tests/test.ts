import * as firebase from '@firebase/testing';
import * as fs from 'fs';

// TODO: test document ID extraction
const projectId = "lawkwk-id";
const rules = fs.readFileSync('firestore.rules', 'utf8');
const myId = "myId";
const myUserName = "myUserName";
const myAuth = { uid: myId, email: "myMail@gmail.com" };
const theirId = "theirId";
const theirUserName = "theirUserName";
const theirAuth = { uid: theirId, email: "theirMail@gmail.com" };

const FieldValue = firebase.firestore.FieldValue;

function getFirestore(auth?: object) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId }).firestore();
}

async function prepareMyUserData() {
  const admin = getAdminFirestore();
  await admin.collection("users").doc(myId).set({
    uid: myId,
    userName: myUserName,
    tweetsCount: 0
  });
  return myId;
}

async function prepareTheirUserData() {
  const admin = getAdminFirestore();
  await admin.collection("users").doc(theirId).set({
    uid: theirId,
    userName: theirUserName,
    tweetsCount: 0
  });
  return theirId;
}

async function prepareMyUserDataWithBio() {
  const admin = getAdminFirestore();
  await admin.collection("users").doc(myId).set({
    uid: myId,
    userName: myUserName,
    tweetsCount: 0,
    bio: "InitialBio"
  });
  return myId;
}

async function prepareMyTweetData() {
  const admin = getAdminFirestore();
  const myUserDocId = await prepareMyUserData();
  const myUserDoc = admin.collection("users").doc(myUserDocId);
  const tweetId = "testTweetId";
  await admin.collection("tweets").doc(tweetId).set({ user: myUserDoc, userName: myUserName, tweetText: "initialTweetText", likeSum: 0 });
  return tweetId;
}

async function prepareThirdPersonTweetData() {
  const admin = getAdminFirestore();
  const thirdPersonName = 'thirdPersonName';
  const thirdPersonUserDoc = await admin.collection("users").add({ uid: 'thirdPersonId', userName: thirdPersonName });
  const tweetId = "testTweetId";
  await admin.collection("tweets").doc(tweetId).set({ user: thirdPersonUserDoc, userName: thirdPersonName, tweetText: "initialTweetText", likeSum: 0 });
  return tweetId;
}

async function prepareMyLikeData() {
  const admin = getAdminFirestore();
  const thirdPersonName = 'thirdPersonName';
  const thirdPersonUserDoc = await admin.collection("users").add({ uid: 'thirdPersonId', userName: thirdPersonName });
  const myUserDocId = await prepareMyUserData();
  const myUserDoc = admin.collection("users").doc(myUserDocId);
  const thirdPersonTweetDoc = await admin.collection("tweets").add({
    user: thirdPersonUserDoc,
    userName: thirdPersonName,
    tweetText: "initialTweetText",
    likeSum: 0
  });
  const likeId = `${myUserDocId}_${thirdPersonTweetDoc.id}`;
  await admin.collection("likes").doc(likeId).set({ user: myUserDoc, tweet: thirdPersonTweetDoc, likeValue: 0 });
  return likeId;
}

before(async () => {
  await firebase.loadFirestoreRules({ projectId, rules });
});

beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId });
});

describe("Twitter Security Rule", () => {
  describe("Users", () => {
    describe("Get", () => {
      it("Unauthenticated user can get users data", async () => {
        const db = getFirestore();
        const myUserDoc = db.collection("users").doc("testDoc");
        await firebase.assertSucceeds(myUserDoc.get());
      });
    });

    describe("List", () => {
      it("Unauthenticated user can't list users data", async () => {
        const db = getFirestore();
        await firebase.assertFails(db.collection("users").get());
      });
      it("Owner user can list users data", async () => {
        const db = getFirestore(myAuth);
        await firebase.assertSucceeds(db.collection("users").get());
      });
      it("Non owner user can list users data", async () => {
        const db = getFirestore(myAuth);
        await firebase.assertSucceeds(db.collection("users").get());
      });
    });

    describe("Create", () => {
      describe("Ownership", () => {
        it("Can't create a user document with a different ID as our user", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(theirId).set({ uid: theirId, userName: theirUserName }));
        });
        it("Can't create a user document with a different ID as our user (2)", async () => {
          const db = getFirestore(theirAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({ uid: myId, userName: myUserName }));
        });
      });

      describe("Field Keys", () => {
        it("Can create a user document with only required fields", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertSucceeds(
            userCollection.doc(myId).set({ uid: myId, userName: myUserName, tweetsCount: 0, }));
        });
        it("Can create a user document with required fields and optional fields", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertSucceeds(
            userCollection.doc(myId).set({ uid: myId, userName: myUserName, tweetsCount: 0, bio: 'randomBio' }));
        });
        it("Can't create a user document with empty document", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({}));
        });
        it("Can't create a user document without required field", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({ nonRequiredField: 'nonRequiredValue' }));
        });
        it("Can't create a user document with unnecessary field", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({
            uid: myId, userName: myUserName, tweetsCount: 0, unnecessaryField: 'unnecesaryValue'
          }));
        });
        it("Can't create a user document without uid", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({ userName: myUserName, tweetsCount: 0, }));
        });
        it("Can't create a user document without userName", async () => {
          const db = getFirestore(myAuth);
          const userCollection = db.collection("users");
          await firebase.assertFails(userCollection.doc(myId).set({ uid: myId, tweetsCount: 0, }));
        });
      });

      describe("Field Type", () => {
        describe("uid", () => {
          it("Can't create a user document with non string uid", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(
              userCollection.doc('123').set({ uid: 123, userName: myUserName, tweetsCount: 0, }));
          });
        });
        describe("userName", () => {

          it("Can't create a user document with non string username", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(userCollection.doc(myId).set({ uid: myId, userName: 123, tweetsCount: 0 }));
          });
          it("Can create a user document with userName of length 15", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertSucceeds(
              userCollection.doc(myId).set({ uid: myId, userName: 'a'.repeat(15), bio: 'randomBio', tweetsCount: 0 })
            );
          });
          it("Can't create a user document with userName of length 16", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(userCollection.doc(myId).set({
              uid: myId, userName: 'a'.repeat(16), bio: 'randomBio', tweetsCount: 0
            }));
          });
          it("Can create a user document with userName of length 1", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertSucceeds(userCollection.doc(myId).set({
              uid: myId, userName: 'a', bio: 'randomBio', tweetsCount: 0
            }));
          });
          it("Can't create a user document with userName of length 0", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(userCollection.doc(myId).set({
              uid: myId, userName: '', bio: 'randomBio', tweetsCount: 0
            }));
          });
        });
        describe("bio", () => {
          it("Can't create a user document with non string bio", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(userCollection.doc(myId).set({
              uid: myId, userName: myUserName, bio: 123, tweetsCount: 0
            }));
          });
          it("Can create a user document with bio of length 160", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertSucceeds(
              userCollection.doc(myId).set({ uid: myId, userName: myUserName, bio: 'a'.repeat(160), tweetsCount: 0 })
            );
          });
          it("Can't create a user document with bio of length 161", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(
              userCollection.doc(myId).set({ uid: myId, userName: myUserName, bio: 'a'.repeat(161), tweetsCount: 0 })
            );
          });
          it("Can create a user document with bio of length 1", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertSucceeds(userCollection.doc(myId).set({
              uid: myId, userName: myUserName, bio: 'a', tweetsCount: 0
            }));
          });
          it("Can't create a user document with bio of length 0", async () => {
            const db = getFirestore(myAuth);
            const userCollection = db.collection("users");
            await firebase.assertFails(userCollection.doc(myId).set({
              uid: myId, userName: myUserName, bio: '', tweetsCount: 0
            }));
          });
        });
      });

    });

    describe("Update", () => {

      it("Can update username", async () => {
        const docId = await prepareMyUserData();

        const db = getFirestore(myAuth);
        const myUserDoc = db.collection("users").doc(docId);
        await firebase.assertSucceeds(myUserDoc.update({ userName: "randomName" }));
      });
      it("Can create bio when bio doesn't exists", async () => {
        const docId = await prepareMyUserData();

        const db = getFirestore(myAuth);
        const myUserDoc = db.collection("users").doc(docId);
        await firebase.assertSucceeds(myUserDoc.update({ bio: "randomBio" }));
      });
      it("Can update bio when bio already exists", async () => {
        const docId = await prepareMyUserDataWithBio();

        const db = getFirestore(myAuth);
        const myUserDoc = db.collection("users").doc(docId);
        await firebase.assertSucceeds(myUserDoc.update({ bio: "randomBio" }));
      });
      it("Can update username and bio when bio doesn't exists", async () => {
        const docId = await prepareMyUserData();

        const db = getFirestore(myAuth);
        const myUserDoc = db.collection("users").doc(docId);
        await firebase.assertSucceeds(myUserDoc.update({ userName: "randomName", bio: "randomBio" }));
      });
      it("Can update username and bio when bio already exists", async () => {
        const docId = await prepareMyUserDataWithBio();

        const db = getFirestore(myAuth);
        const myUserDoc = db.collection("users").doc(docId);
        await firebase.assertSucceeds(myUserDoc.update({ userName: "randomName", bio: "randomBio" }));
      });
      describe("Ownership", () => {
        it("Can't update a user document with a different ID as our user", async () => {
          const admin = getAdminFirestore();
          const userId = "testUserId";
          await admin.collection("users").doc(userId).set({
            uid: theirId,
            userName: theirUserName,
            tweetsCount: 0,
          });

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ userName: "randomName" }));
        });
        it("Can't update a user document with a different ID as our user (2)", async () => {
          const docId = await prepareMyUserData();

          const db = getFirestore(theirAuth);
          const myUserDoc = db.collection("users").doc(docId);
          await firebase.assertFails(myUserDoc.update({ userName: "randomName" }));
        });
      });
      describe("Field Keys", () => {
        it("Can't update user uid", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ uid: "random Id" }));
        });
        it("Can't update user uid even if userName provided", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ userName: "randomName", uid: "random Id" }));
        });
        it("Can't update tweetsCount", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ tweetsCount: 1000 }));
        });
        it("Can't add new field", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ newField: "newValue" }));
        });
        it("Can't add new field event with userName", async () => {
          const docId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(docId);
          await firebase.assertFails(myUserDoc.update({ userName: "randomName", newField: "newValue" }));
        });
        it("Can't delete userName", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ userName: FieldValue.delete() }));
        });
        it("Can't delete uid", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ uid: FieldValue.delete() }));
        });
        it("Can't delete tweetsCount", async () => {
          const userId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertFails(myUserDoc.update({ tweetsCount: FieldValue.delete() }));
        });
        it("Can delete bio", async () => {
          const userId = await prepareMyUserDataWithBio();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(userId);
          await firebase.assertSucceeds(myUserDoc.update({ bio: FieldValue.delete() }));
        });
      });
      describe("Field Type", () => {
        describe("userName", () => {
          it("Can't update userName to non string", async () => {
            const userId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(userId);
            await firebase.assertFails(myUserDoc.update({ userName: 123 }));
          });
          it("Can update userName with length 15", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ userName: "a".repeat(15) }));
          });
          it("Can't update userName with length 16", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ userName: "a".repeat(16) }));
          });
          it("Can update userName with length 1", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ userName: "a" }));
          });
          it("Can't update userName with length 0", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ userName: "" }));
          });
        });

        describe("bio", () => {
          it("Can't update bio to non string", async () => {
            const userId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(userId);
            await firebase.assertFails(myUserDoc.update({ bio: 123 }));
          });
          it("Can create bio with length 160 when bio doesn't exists", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ bio: "a".repeat(160) }));
          });
          it("Can't create bio with length 161 when bio doesn't exists", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ bio: "a".repeat(161) }));
          });
          it("Can create bio with length 1 when bio doesn't exists", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ bio: "a" }));
          });
          it("Can't create bio with length 0 when bio doesn't exists", async () => {
            const docId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ bio: "" }));
          });
          it("Can create bio with length 160 when bio already exists", async () => {
            const docId = await prepareMyUserDataWithBio();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ bio: "a".repeat(160) }));
          });
          it("Can't create bio with length 161 when bio already exists", async () => {
            const docId = await prepareMyUserDataWithBio();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ bio: "a".repeat(161) }));
          });
          it("Can create bio with length 1 when bio already exists", async () => {
            const docId = await prepareMyUserDataWithBio();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertSucceeds(myUserDoc.update({ bio: "a" }));
          });
          it("Can't create bio with length 0 when bio already exists", async () => {
            const docId = await prepareMyUserDataWithBio();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(docId);
            await firebase.assertFails(myUserDoc.update({ bio: "" }));
          });
        });
      });
    });

    describe("Delete", () => {
      it("Can't delete users data", async () => {
        const userId = await prepareMyUserData();

        const db = getFirestore();
        const myUserDoc = db.collection("users").doc(userId);
        await firebase.assertFails(myUserDoc.delete());
      });
    });
  });

  describe("Tweets", () => {
    describe("Get", () => {
      it("Unauthenticated user can get tweet data", async () => {
        const db = getFirestore();
        const tweetDoc = db.collection("tweets").doc("testDoc");
        await firebase.assertSucceeds(tweetDoc.get());
      });
    });

    describe("List", () => {
      it("Unauthenticated user can list tweet data", async () => {
        const db = getFirestore();
        await firebase.assertSucceeds(db.collection("tweets").get());
      });
    });

    describe("Create", () => {
      describe("Ownership", () => {
        it("Can create a tweet document with the same reference.uid as our user", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertSucceeds(tweetCollection.add({
            user: myUserDoc,
            userName: myUserName,
            tweetText: "randomTweetText",
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
          }));
        });
        it("Can't create a tweet document with a different reference.uid as our user", async () => {
          const admin = getAdminFirestore();
          const theirUserDoc = await admin.collection("users").add({ uid: theirId });

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          await firebase.assertFails(tweetCollection.add({
            user: theirUserDoc,
            userName: theirUserName,
            tweetText: "randomTweetText",
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
          }));
        });
        it("Can't create a tweet document with a different reference.uid as our user (2)", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(theirAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
            userName: myUserName,
            tweetText: "randomTweetText",
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
          }));
        });
      });

      describe("Field Type", () => {
        describe("tweetText", () => {
          it("Can't create a tweet document with non string tweetText", async () => {
            const myUserDocId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(myUserDocId);
            await firebase.assertFails(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: 123,
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
          it("Can create a tweet document with tweetText of length 280", async () => {
            const myUserDocId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(myUserDocId);
            await firebase.assertSucceeds(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: 'a'.repeat(280),
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
          it("Can't create a tweet document with tweetText of length 281", async () => {
            const myUserDocId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(myUserDocId);
            await firebase.assertFails(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: 'a'.repeat(281),
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
          it("Can create a tweet document with tweetText of length 1", async () => {
            const myUserDocId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(myUserDocId);
            await firebase.assertSucceeds(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: 'a',
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
          it("Can't create a tweet document with tweetText of length 0", async () => {
            const myUserDocId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(myUserDocId);
            await firebase.assertFails(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: '',
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
        });

        describe("user", () => {
          it("Can't create a tweet document with non reference user", async () => {
            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            await firebase.assertFails(tweetCollection.add({
              user: { uid: myId },
              userName: myUserName,
              tweetText: 123,
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
          it("Can't create tweet if user document doesn't exists", async () => {
            const nonexistingUserDocId = "nonexistingUserDocId";
            const db = getFirestore(myAuth);
            const tweetCollection = db.collection("tweets");
            const myUserDoc = db.collection("users").doc(nonexistingUserDocId);
            await firebase.assertFails(tweetCollection.add({
              user: myUserDoc,
              userName: myUserName,
              tweetText: "randomTweetText",
              likesSum: 0,
              creationTime: FieldValue.serverTimestamp(),
            }));
          });
        });
      });

      describe("Field Keys", () => {
        it("Can't create a tweet document with empty document", async () => {
          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          await firebase.assertFails(tweetCollection.add({}));
        });

        it("Can't create a tweet document without required field", async () => {
          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          await firebase.assertFails(tweetCollection.add({
            nonRequiredField: 'nonRequiredValue'
          }));
        });

        it("Can't create a tweet document with unnecessary field", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
            userName: myUserName,
            tweetText: "randomTweetText",
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
            unnecessaryField: 'unnecesaryValue'
          }));
        });

        it("Can't create a tweet document without username", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
            tweetText: "randomTweetText",
          }));
        });
        it("Can't create a tweet document with different userName as user", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
            tweetText: "randomTweetText",
            likesSum: 0,
            creationTime: FieldValue.serverTimestamp(),
            userName: theirUserName,
          }));
        });
        it("Can't create a tweet document with likesSum 1", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
            tweetText: "randomTweetText",
            likesSum: 1,
            creationTime: FieldValue.serverTimestamp(),
            userName: myUserName,
          }));
        });

        it("Can't create a tweet document with only user data provided", async () => {
          const myUserDocId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          const myUserDoc = db.collection("users").doc(myUserDocId);
          await firebase.assertFails(tweetCollection.add({
            user: myUserDoc,
          }));
        });

        it("Can't create a tweet document with only tweetText data provided", async () => {
          const db = getFirestore(myAuth);
          const tweetCollection = db.collection("tweets");
          await firebase.assertFails(tweetCollection.add({
            tweetText: "randomTweetText"
          }));
        });
      });
    });

    describe("Update", () => {

      describe("Ownership", () => {
        it("Can't update if not owner", async () => {
          const admin = getAdminFirestore();
          const theirUserDoc = await admin.collection("users").add({ uid: theirId, userName: theirUserName });
          const tweetId = "docId";
          await admin.collection("tweets").doc(tweetId).set({ user: theirUserDoc, userName: myUserName, tweetText: "initialTweetText", likeSum: 0 });

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: "randomTweetText" }));
        });
        it("Can't update if not owner (2)", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(theirAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: "randomTweetText" }));
        });
      });
      describe("Field Keys", () => {
        it("Can't add new field", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: "randomTweetText", newField: "newValue" }));
        });
        it("Can't update field user", async () => {
          const admin = getAdminFirestore();
          const theirUserDoc = await admin.collection("users").add({ uid: theirId });
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ user: theirUserDoc }));
        });
        it("Can't update field userName", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ userName: "randomUserName" }));
        });
        it("Can't update field likeSum", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ likeSum: 20 }));
        });
        it("Can't delete field user", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ user: FieldValue.delete() }));
        });
        it("Can't delete field userName", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ userName: FieldValue.delete() }));
        });
        it("Can't delete field likeSum", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ likeSum: FieldValue.delete() }));
        });
        it("Can't delete field tweetText", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: FieldValue.delete() }));
        });
      });
      describe("Field Type", () => {
        it("Can't update tweetText to non string", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: 123 }));
        });
        it("Can update tweetText with length 280", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertSucceeds(myTweetDoc.update({ tweetText: "a".repeat(280) }));
        });
        it("Can't update tweetText with length 281", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: "a".repeat(281) }));
        });
        it("Can update tweetText with length 1", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertSucceeds(myTweetDoc.update({ tweetText: "a" }));
        });
        it("Can't update tweetText with length 0", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.update({ tweetText: "" }));
        });
      });
    });

    describe("Delete", () => {
      describe("Ownership", () => {
        it("Can delete a tweet if it's owner", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertSucceeds(myTweetDoc.delete());
        });
        it("Can't delete a tweet if not it's owner", async () => {
          const admin = getAdminFirestore();
          const theirUserDoc = await admin.collection("users").add({ uid: theirId });
          const tweetId = "testTweetId";
          await admin.collection("tweets").doc(tweetId).set({ user: theirUserDoc });

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.delete());
        });
        it("Can't delete a tweet if not it's owner (2)", async () => {
          const tweetId = await prepareMyTweetData();

          const db = getFirestore(theirAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(myTweetDoc.delete());
        });
      });
    });
  });
  describe("Likes", () => {
    describe("Get", () => {
      describe("Ownership", () => {
        it("Can get like document if owner", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertSucceeds(myLikeDoc.get());
        });
        it("Can get like document if documentId correct", async () => {
          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(`${myId}_someTweetId`);
          await firebase.assertSucceeds(myLikeDoc.get());
        });
        it("Can't get like document if unauthenticated", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore();
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.get());
        });
        it("Can't get like document if not owner", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(theirAuth);
          const likeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(likeDoc.get());
        });
      });
    });
    describe("List", () => {
      it("Can't list like document", async () => {
        const db = getFirestore();
        await firebase.assertFails(db.collection("likes").get());
      });
    });
    describe("Create", () => {
      describe("Ownership", () => {
        it("Can't create like document if not owner", async () => {
          const tweetId = await prepareThirdPersonTweetData();
          const myUserId = await prepareMyUserData();

          const db = getFirestore(theirAuth);
          const myUserDoc = db.collection("users").doc(myUserId);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(
            db.collection("likes")
              .doc(`${myUserId}_${tweetId}`)
              .set({ user: myUserDoc, tweet: myTweetDoc, likeValue: 3 }));
        });
      });
      describe("Field Key", () => {
        it("Can't create like document if likeValue not provided", async () => {
          const tweetId = await prepareThirdPersonTweetData();
          const myUserId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(myUserId);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(
            db.collection("likes")
              .doc(`${myUserId}_${tweetId}`)
              .set({ user: myUserDoc, tweet: myTweetDoc }));
        });
        it("Can't create like document if user not provided", async () => {
          const tweetId = await prepareThirdPersonTweetData();

          const db = getFirestore(myAuth);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(
            db.collection("likes")
              .doc(`_${tweetId}`)
              .set({ tweet: myTweetDoc, likeValue: 3 }));
        });
        it("Can't create like document if tweet not provided", async () => {
          const myUserId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(myUserId);
          await firebase.assertFails(
            db.collection("likes")
              .doc(`${myUserId}_`)
              .set({ user: myUserDoc, likeValue: 3 }));
        });
        it("Can't create like document if unnecessary field provided", async () => {
          const tweetId = await prepareThirdPersonTweetData();
          const myUserId = await prepareMyUserData();

          const db = getFirestore(myAuth);
          const myUserDoc = db.collection("users").doc(myUserId);
          const myTweetDoc = db.collection("tweets").doc(tweetId);
          await firebase.assertFails(db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
            user: myUserDoc,
            tweet: myTweetDoc,
            likeValue: 3,
            unnecessaryField: "unnecessaryValue"
          }));
        });
      });
      describe("Field Type", () => {
        describe("user", () => {
          it("Can't create like document if user is not reference", async () => {
            const tweetId = await prepareThirdPersonTweetData();

            const db = getFirestore(myAuth);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(
              db.collection("likes").doc(`_${tweetId}`).set({ user: 'myUser', tweet: myTweetDoc, likeValue: 3 }));
          });
          it("Can't create like document if user document doesn't exists", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const nonexistingUserDocId = "nonexistingUserDocId";

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(nonexistingUserDocId);;
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(db.collection("likes")
              .doc(`_${tweetId}`).set({ user: myUserDoc, tweet: myTweetDoc, likeValue: 3 }));
          });
        });
        describe("tweet", () => {
          it("Can't create like document if tweet is not reference", async () => {
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            await firebase.assertFails(
              db.collection("likes")
                .doc(`${myUserId}_`)
                .set({ user: myUserDoc, tweet: 'tweet', likeValue: 3 }));
          });
          it("Can't create like document if tweet document doesn't exists", async () => {
            const myUserId = await prepareMyUserData();

            const nonexistingTweetDocId = "nonexistingTweetDocId";
            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(nonexistingTweetDocId);
            await firebase.assertFails(db.collection("likes")
              .doc(`${myUserId}_`).set({ user: myUserDoc, tweet: myTweetDoc, likeValue: 3 }));
          });
        });
        describe("likeValue", () => {
          it("Can't create like document if likeValue is not int", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
              user: myUserDoc,
              tweet: myTweetDoc,
              likeValue: '3'
            }));
          });
          it("Can create like document if likeValue is 5", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertSucceeds(db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
              user: myUserDoc, tweet: myTweetDoc, likeValue: 5
            }));
          });
          it("Can't create like document if likeValue is 6", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
              user: myUserDoc, tweet: myTweetDoc, likeValue: 6
            }));
          });
          it("Can't create like document if likeValue is 0", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(
              db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
                user: myUserDoc, tweet: myTweetDoc, likeValue: 0,
              }));
          });
          it("Can create like document if likeValue is 1", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertSucceeds(
              db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
                user: myUserDoc, tweet: myTweetDoc, likeValue: 1,
              }));
          });
          it("Can't create like document if likeValue is -1", async () => {
            const tweetId = await prepareThirdPersonTweetData();
            const myUserId = await prepareMyUserData();

            const db = getFirestore(myAuth);
            const myUserDoc = db.collection("users").doc(myUserId);
            const myTweetDoc = db.collection("tweets").doc(tweetId);
            await firebase.assertFails(db.collection("likes").doc(`${myUserId}_${tweetId}`).set({
              user: myUserDoc, tweet: myTweetDoc, likeValue: -1
            }));
          });
        });
      });
    });
    describe("Update", () => {

      describe("Ownership", () => {
        it("Can't update if not owner", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(theirAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ likeValue: 5 }));
        });
      });
      describe("Field Key", () => {
        it("Can't create new field ", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ likeValue: 5, newField: 'newValue' }));
        });
        it("Can't update user even with likeValue", async () => {
          const likeId = await prepareMyLikeData();
          const theirUserDocId = await prepareTheirUserData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          const theirUserDoc = db.collection("users").doc(theirUserDocId);
          await firebase.assertFails(myLikeDoc.update({ likeValue: 5, user: theirUserDoc }));
        });
        it("Can't update user field", async () => {
          const likeId = await prepareMyLikeData();
          const theirUserDocId = await prepareTheirUserData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          const theirUserDoc = db.collection("users").doc(theirUserDocId);
          await firebase.assertFails(myLikeDoc.update({ user: theirUserDoc }));
        });
        it("Can't update tweet field", async () => {
          const likeId = await prepareMyLikeData();
          const tweetId = await prepareThirdPersonTweetData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ tweet: tweetId }));
        });
        it("Can't delete likeValue field", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ likeValue: FieldValue.delete() }));
        });
        it("Can't delete user field", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ user: FieldValue.delete() }));
        });
        it("Can't delete tweet field", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(myAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.update({ tweet: FieldValue.delete() }));
        });
      });
      describe("Field Type", () => {
        describe("likeValue", () => {
          it("Can't update likeValue if not int", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertFails(myLikeDoc.update({ likeValue: '123' }));
          });
          it("Can update likeValue to 5", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertSucceeds(myLikeDoc.update({ likeValue: 5 }));
          });
          it("Can't update likeValue to 6", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertFails(myLikeDoc.update({ likeValue: 6 }));
          });
          it("Can update likeValue to 1", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertSucceeds(myLikeDoc.update({ likeValue: 1 }));
          });
          it("Can't update likeValue to 0", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertFails(myLikeDoc.update({ likeValue: 0 }));
          });
          it("Can't update likeValue to -1", async () => {
            const likeId = await prepareMyLikeData();

            const db = getFirestore(myAuth);
            const myLikeDoc = db.collection("likes").doc(likeId);
            await firebase.assertFails(myLikeDoc.update({ likeValue: -1 }));
          });
        });
      });
    });
    describe("Delete", () => {
      it("Can delete if owner", async () => {
        const likeId = await prepareMyLikeData();

        const db = getFirestore(myAuth);
        const myLikeDoc = db.collection("likes").doc(likeId);
        await firebase.assertSucceeds(myLikeDoc.delete());
      });

      describe("Ownership", () => {
        it("Can't delete if not owner", async () => {
          const likeId = await prepareMyLikeData();

          const db = getFirestore(theirAuth);
          const myLikeDoc = db.collection("likes").doc(likeId);
          await firebase.assertFails(myLikeDoc.delete());
        });
      });
    });
  });
});

after(async () => {
  await firebase.clearFirestoreData({ projectId });
});