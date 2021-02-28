import { expect } from "chai";
import {firestore} from "firebase-admin"
import * as firebaseTesting from '@firebase/testing';

const projectId = 'flamestore';

const sleep = (milli: number) => new Promise((res) => setTimeout(res, milli));

describe("Cloud Functions", () => {

  beforeEach(() => {
    firebaseTesting.clearFirestoreData({projectId})
  })

  describe("users", () => {
      it("1 + 1 = 2", async () => {
        expect(1 + 1).to.equal(2)
      });

      it("create one", async () => {
        const db = firestore();
        await db.collection("posts").add({ title: "New Post" });
        await sleep(5000);
        const postCount = (await db.collection("posts").get()).docs.length;
        expect(postCount).to.equal(1);
        expect(postCount).to.not.equal(0);
        const statsCount = (await db.collection("stats").get()).docs.length;
        expect(statsCount).to.equal(1);
        expect(postCount).to.not.equal(0);
      });

      it("should be zero", async () => {
        const db = firestore();
        await sleep(5000);
        const postCount = (await db.collection("posts").get()).docs.length;
        expect(postCount).to.equal(0);
        expect(postCount).to.not.equal(1);
        const statsCount = (await db.collection("stats").get()).docs.length;
        expect(statsCount).to.equal(0);
        expect(postCount).to.not.equal(1);
      });


  });
});