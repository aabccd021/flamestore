import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import getContent from "./trigger-generator";
import { FlamestoreSchema } from '../schema';
import { getPascalCollectionName } from '../util';

export default function generate(schema: FlamestoreSchema, outputFilePath: string) {
  Object.entries(getContent(schema)).forEach(([colName, colString]) => {
    const modelNames = Object.keys(schema.collections)
      .map(collectionName => getPascalCollectionName(collectionName))
      .join(',');
    const imports = `import {${modelNames}} from "../models"`;
    const triggerContent = triggerHeader(schema, imports) + colString;
    const triggerFileContent = prettier.format(triggerContent, { parser: "typescript" });
    const triggerDir = path.join(outputFilePath, 'triggers')
    if (!fs.existsSync(triggerDir)) {
      fs.mkdirSync(triggerDir);
    }
    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerFileContent);
  });


  fs.writeFileSync(path.join(outputFilePath, 'index.ts'), indexHeader(schema));
}

const indexHeader = (schema: FlamestoreSchema) => {
  return Object.keys(schema.collections).map(e => `export * as ${e} from "./triggers/${e}";`).join('\n');
}




const modelImports = (schema: FlamestoreSchema) => {

};

const triggerHeader = (schema: FlamestoreSchema, imports: string) => {
  const region = schema.configuration.region;
  const importFunction = region ? '_functions' : 'functions';
  const regionFunction = region ? `const functions = _functions.region('${region}');` : '';
  return `/* tslint:disable */
import * as ${importFunction} from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { foundDuplicate, allSettled, update, increment, syncField} from 'flamestore';
${imports}

${regionFunction}
`;
};
