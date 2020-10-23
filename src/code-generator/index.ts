import { FlamestoreSchema } from "../utils/interface";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import getContent from "./trigger-generator";
import { getSchemaContent } from "./schema-generator/generate-schema";
import { getPascalCollectionName } from "./generator-util";

export default function generate(schema: FlamestoreSchema, outputFilePath: string) {
  Object.entries(getContent(schema)).forEach(([colName, colString]) => {
    const triggerContent = triggerHeader(schema, modelImports(schema)) + colString;
    const triggerFileContent = prettier.format(triggerContent, { parser: "typescript" });
    fs.writeFileSync(path.join(outputFilePath, `${colName}.trigger.ts`), triggerFileContent);
  }
  );

  const modelContent = modelHeader + getSchemaContent(schema);
  const modelFileContent = prettier.format(modelContent, { parser: "typescript" });
  fs.writeFileSync(path.join(outputFilePath, 'model.ts'), modelFileContent);

  const utilsFileContent = prettier.format(utilsContent, { parser: "typescript" });
  fs.writeFileSync(path.join(outputFilePath, 'utils.ts'), utilsFileContent);


  fs.writeFileSync(path.join(outputFilePath, 'index.ts'), indexHeader(schema));
}

const indexHeader = (schema: FlamestoreSchema) => {
  return Object.keys(schema.collections).map(e => `export * from "./${e}.trigger";`).join('\n');
}


const modelHeader = `/* tslint:disable */
import { firestore } from 'firebase-admin';

`;

const modelImports = (schema: FlamestoreSchema) => {
  const modelNames = Object.keys(schema.collections).map(n => getPascalCollectionName(n)).join(',');
  return `import {${modelNames}} from "./model"`;
};

const triggerHeader = (schema: FlamestoreSchema, imports: string) => {
  const region = schema.configuration.region;
  const importFunction = region ? '_functions' : 'functions';
  const regionFunction = region ? `const functions = _functions.region('${region}');` : '';
  return `/* tslint:disable */
import * as ${importFunction} from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { foundDuplicate, allSettled, updateIfNotEmpty, increment, syncField} from './utils';
${imports}

${regionFunction}
`;
};

const utilsContent = `
import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';

export const increment = firestore.FieldValue.increment;
export const foundDuplicate = async (
  collectionName: string,
  fieldName: string,
  snapshotOrChange: functions.firestore.QueryDocumentSnapshot
    | functions.Change<functions.firestore.QueryDocumentSnapshot>,
  context: functions.EventContext,
): Promise<boolean> => {
  function isSnapshot(value: functions.firestore.QueryDocumentSnapshot
    | functions.Change<functions.firestore.QueryDocumentSnapshot>):
    value is functions.firestore.QueryDocumentSnapshot {
    return !value.hasOwnProperty('after');
  }
  const snapshot = isSnapshot(snapshotOrChange) ? snapshotOrChange : snapshotOrChange.after;
  const duplicates = await firestore()
    .collection(collectionName)
    .where(fieldName, "==", snapshot.data()[fieldName])
    .get();
  if (duplicates.docs.length > 1) {
    functions.logger.warn(
      \`Duplicate \${fieldName} created on \${collectionName}\`,
      { snapshot, context }
    );
    if(isSnapshot(snapshotOrChange)){
      await snapshotOrChange.ref.delete();
    } else {
      await snapshotOrChange.before.ref.update({[fieldName]: snapshotOrChange.before.data()[fieldName]})
    }
    return true;
  }
  return false;
};
export const allSettled = (promises: Promise<any>[]): Promise<any> => {
  return Promise.all(promises.map((p) => p.catch((_) => null)));
};
export const updateIfNotEmpty = async (
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
) => {
  functions.logger.log(\`Update \${ref.id}\`, { data: data });
  if (Object.keys(data).length > 0) {
    await ref.update(data);
  }
};
export const syncField = async (
  collection: string,
  refField: string,
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
) => {
  if (Object.keys(data).length === 0) {
    return;
  }
  const querySnapshot = await firestore()
    .collection(collection)
    .where(refField, "==", ref)
    .get();
  const results = await Promise.all(
    querySnapshot.docs.map((doc) => doc.ref
      .update(data)
      .then((_) => "")
      .catch((__) => \`\${ doc.ref.id }\`)
    )
  );
  const filteredResult = results.filter((result) => result !== "");
  functions.logger.log(
    \`Update where \${ collection }.\${ refField }.id == \${ ref.id } success on \${ results.length - filteredResult.length } documents\`,
    { updateData: data }
  );
  if (filteredResult.length > 0) {
    functions.logger.warn(
      \`Update where \${ collection }.\${ refField }== \${ ref.id } fail on \${ filteredResult.length } documents\`,
      { documentIds: filteredResult }
    );
  }
};
`;