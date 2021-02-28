// import { forIn, isEmpty, isNil, isObject, omitBy } from "lodash";
// import { logger } from "firebase-functions";
// import { User } from "../models";
// import { foundDuplicate, functions, syncField } from "../utils";

// export const onCreate = functions.firestore
//   .document("/users/{documentId}")
//   .onCreate(async (snapshot, context) => {
//     if (await foundDuplicate("users", "userName", snapshot, context)) return;
//     const userData = { tweetsCount: 0 };
//     await update(snapshot.ref, userData);
//   });
// export const onUpdate = functions.firestore
//   .document("/users/{documentId}")
//   .onUpdate(async (snapshot, context) => {
//     const before = snapshot.before.data() as User;
//     const after = snapshot.after.data() as User;
//     if (await foundDuplicate("users", "userName", snapshot, context)) return;
//     const tweetsOwnerData = {
//       owner: {
//         userName: before.userName !== after.userName ? after.userName : null,
//       },
//     };
//     await syncField("tweets", "owner", snapshot, tweetsOwnerData);
//   });

// export async function update(
//   ref: FirebaseFirestore.DocumentReference,
//   rawData: { [fieldName: string]: unknown }
// ): Promise<void> {
//   const data = deepOmitNil(rawData);
//   if (data) {
//     logger.log(`Update ${ref.id}`, { omittedData: data });
//     await ref.set(data, { merge: true });
//   }
// }
// function deepOmitNil(obj: any) {
//   forIn(obj, (value, key) => {
//     obj[key] =
//       isObject(value) && !(value instanceof FirebaseFirestore.FieldValue)
//         ? deepOmitNil(value)
//         : value;
//   });
//   const omitted = omitBy(obj, isNil);
//   if (isEmpty(omitted)) return null;
//   return omitted;
// }
