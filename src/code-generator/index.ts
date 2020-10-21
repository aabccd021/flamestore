import { Schema } from "../utils/interface";
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import getContent from "./trigger-generator";
import { getSchemaContent } from "./schema-generator/generate-schema";

export default function generate(schema: Schema, outputFilePath: string) {
  let content = '';
  content += imports;
  content += getSchemaContent(schema);
  content += getContent(schema);
  content += footer;
  const writeContent = prettier.format(content, { parser: "typescript" });
  fs.writeFileSync(outputFilePath, writeContent);
}


const imports = `/* tslint:disable */
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

`

const footer = `
const log = (name: string, value: any) => {
  if (Object.keys(value).length !== 0){
    functions.logger.log(name, value);
  }
};
const warn = functions.logger.warn;
const handleError = (p: Promise<any>) => p.catch((_) => null);
const increment = firestore.FieldValue.increment;
const updateIfNotEmpty = (
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
): Promise<firestore.WriteResult>[] => {
  if (Object.keys(data).length > 0){
    return [ref.update(data)];
  }
  return [];
};
const queryUpdate = async (
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
  log(
    \`Update where \${ collection }.\${ refField }.id == \${ ref.id } success on \${ results.length - filteredResult.length } documents\`,
    { updateData: data }
  );
  if (filteredResult.length > 0) {
    warn(
      \`Update where \${ collection }.\${ refField }== \${ ref.id } fail on \${ filteredResult.length } documents\`,
      { documentIds: filteredResult }
    );
  }
};
`;