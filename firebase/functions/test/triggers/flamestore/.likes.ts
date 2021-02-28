// import * as userTrigger from "../../../src/triggers/flamestore/users";
// import chai from "chai";
// import { test } from "../../index.test";
// import * as sinon from "sinon";

// const assert = chai.assert;

// describe("Cloud Functions", () => {
//   after(() => {
//     test.cleanup();
//   });

//   describe("users", () => {
//     describe("onCreate", () => {
//       it("can create user", async () => {
//         // arrange
//         const context = {};
//         const snap = test.firestore.makeDocumentSnapshot(
//           {
//             userName: "kira",
//             uid: "122",
//           },
//           "users/122"
//         ) as FirebaseFirestore.DocumentSnapshot;
//         sinon.stub(snap.ref, "set").returns(new Promise(() => "a"));

//         // act
//         const wrapped = test.wrap(userTrigger.onCreate);
//         // assert
//         assert.equal(wrapped(snap, context), true);
//         // assert.deepEqual(user.data(), { tweetsCount: 0 });
//       });
//     });
//   });
// });
