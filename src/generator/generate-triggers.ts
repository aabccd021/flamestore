import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { CollectionTriggerMap, FlamestoreModule, FlamestoreSchema, TriggerGenerator, TriggerMap } from './type';
import { getPascalCollectionName } from './util';

export default function generate(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[],
) {
  const triggerGenerators = modules
    .filter(module => module.triggerGenerator)
    .map(module => module.triggerGenerator!);
  const triggerMap = getCompleteTriggerMap(schema, triggerGenerators);


  const triggerDir = path.join(outputFilePath, 'flamestore')
  Object.entries(triggerMap)
    .forEach(([colName, colTriggerMap]) => {
      const colString = stringOfCollectionTrigger(colName, colTriggerMap)
      const triggerContent = triggerContentOf(schema, colString);
      const triggerFileContent = prettier.format(triggerContent, { parser: "typescript" });
      if (!fs.existsSync(triggerDir)) {
        fs.mkdirSync(triggerDir);
      }
      fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerFileContent);
    });


  const region = schema.configuration.region;
  if (region) {
    // const importFunction = region ? '_functions' : 'functions';
    // const regionFunction = region ? `const functions = _functions.region('${region}');` : '';
    const functionContent = `/* tslint:disable */
import * as _functions from 'firebase-functions';
export const functions = _functions.region('${region}');
  `
    fs.writeFileSync(path.join(outputFilePath, 'functions.ts'), functionContent);
  }

  const indexFileContent = Object.keys(schema.collections)
    .map(colName => `export * as ${colName} from "./${colName}";`)
    .join('\n');
  fs.writeFileSync(path.join(triggerDir, 'index.ts'), indexFileContent);
}


const triggerContentOf = (schema: FlamestoreSchema, colString: string) => {
  const functionImport = schema.configuration.region ? '../functions' : 'firebase-admin';
  const modelNames = Object.keys(schema.collections)
    .map(collectionName => getPascalCollectionName(collectionName))
    .join(',');
  return `/* tslint:disable */
import {functions} from '${functionImport}';
import { firestore } from 'firebase-admin';
import { serverTimestamp, foundDuplicate, allSettled, update, increment, syncField} from 'flamestore';
import {${modelNames}} from "../models"

${colString}
`;
};

function getCompleteTriggerMap(schema: FlamestoreSchema, triggerGenerators: TriggerGenerator[]): TriggerMap {
  let triggerMap: TriggerMap = {};
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    triggerMap[collectionName] = new CollectionTriggerMap(collection);
  }
  for (const triggerGenerator of triggerGenerators) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      for (const [fieldName, field] of Object.entries(collection.fields)) {
        triggerMap = triggerGenerator(
          triggerMap,
          collectionName,
          collection,
          fieldName,
          field,
          schema,
        );
      }
    }
  }
  return triggerMap;
}


function stringOfCollectionTrigger(colName: string, colTriggerMap: CollectionTriggerMap): string {
  let content = '';
  if (!colTriggerMap.createTrigger.isEmpty()) {
    content += onCreateTemplate(
      colName,
      colTriggerMap.createTrigger);
  }
  if (!colTriggerMap.updateTrigger.isEmpty()) {
    content += onUpdateTemplate(
      colName,
      colTriggerMap.updateTrigger);
  }
  if (!colTriggerMap.deleteTrigger.isEmpty()) {
    content += onDeleteTemplate(
      colName,
      colTriggerMap.deleteTrigger);
  }
  return content;
}

function onCreateTemplate(
  collectionName: string,
  refTriggerData: TriggerData,
) {
  return triggerTemplate(
    TriggerType.Create,
    collectionName,
    refTriggerData,
    `const data = snapshot.data() as ${getPascalCollectionName(collectionName)};`
  );
}

function onUpdateTemplate(
  collectionName: string,
  refTriggerData: TriggerData,
) {
  return triggerTemplate(
    TriggerType.Update,
    collectionName,
    refTriggerData,
    `const before = change.before.data() as ${getPascalCollectionName(collectionName)};
    const after = change.after.data() as ${getPascalCollectionName(collectionName)};`
  );
}

function onDeleteTemplate(
  collectionName: string,
  refTriggerData: TriggerData,
) {
  return triggerTemplate(
    TriggerType.Delete,
    collectionName,
    refTriggerData,
    `const data = snapshot.data() as ${getPascalCollectionName(collectionName)};`
  );
}

function triggerTemplate(
  triggerType: TriggerType,
  collectionName: string,
  refTriggerData: TriggerData,
  prepareTrigger: string,
) {
  const triggerContent = refTriggerDataToString(refTriggerData);
  const dependencyPromises = dependencyPromisesToString(refTriggerData);
  const batchCommit = refTriggerDataToBatchCommitString(refTriggerData, triggerType)

  const firstParam = triggerType === TriggerType.Update ? 'change' : 'snapshot';
  return `
  export const on${triggerType} = functions.firestore
  .document('/${collectionName}/{documentId}')
  .on${triggerType}(async (${firstParam}, context)=>{
    ${prepareTrigger};

    ${refTriggerData._header};

    ${dependencyPromises};

    ${triggerContent};
    ${batchCommit}
  });
  `
}

function dependencyPromisesToString(triggerData: TriggerData) {
  if (Object.keys(triggerData.dependencyPromises).length === 0) {
    return '';
  }
  let dependencyNames = '';
  let dependencyPromises = '';
  let dependencyAssignment = '';
  for (const [dependencyName, dependencyPromise] of Object.entries(triggerData.dependencyPromises)) {
    dependencyNames += `${dependencyName}Snapshot,`;
    dependencyPromises += `${dependencyPromise.promise},`;
    dependencyAssignment += `const ${dependencyName} = ${dependencyName}Snapshot.data() as ${getPascalCollectionName(dependencyPromise.collection)};`
  }
  return `const [${dependencyNames}] = await Promise.all([${dependencyPromises}]);${dependencyAssignment}`;
}

function refTriggerToString(refName: string, refTrigger: UpdateFieldData) {
  let content = '';
  for (const [fieldName, fieldData] of Object.entries(refTrigger)) {
    let assignment = `${refName}Data.${fieldName}=${fieldData.fieldValue};`;
    if (fieldData.fieldCondition) {
      assignment = `if(${fieldData.fieldCondition}){${assignment}}`
    }
    content += assignment;
  }
  return content;
}

function refTriggerDataToString(triggerData: TriggerData) {
  let content = '';
  for (const [refName, refTrigger] of Object.entries(triggerData._data)) {
    if (refTrigger !== {}) {
      content += `const ${refName}Data: {[fieldName:string]:any} = {};${refTriggerToString(refName, refTrigger)};\n\n`;
    }
  }
  for (const [refName, refTrigger] of Object.entries(triggerData._nonUpdateData)) {
    if (refTrigger !== {}) {
      content += `const ${refName}Data: {[fieldName:string]:any} = {};${refTriggerToString(refName, refTrigger)};\n\n`;
    }
  }
  return content;
}


function refTriggerDataToBatchCommitString(triggerData: TriggerData, triggerType: TriggerType) {
  const dataName = triggerType === TriggerType.Update ? 'after' : 'data';
  const post = triggerType === TriggerType.Update ? '.after' : '';
  const content: string[] = [];
  for (const [refName, refTrigger] of Object.entries(triggerData._data)) {
    const setName = refName === 'snapshotRef' ? `snapshot${post}.ref` : `${dataName}.${refName}`
    if (refTrigger !== {}) {
      content.push(`update(${setName},${refName}Data)`);
    }
  }
  const batchCommit = [...content, ...triggerData._resultPromises];
  if (batchCommit.length === 1) {
    return `await ${batchCommit[0]};`;
  }
  return `await allSettled([
       ${batchCommit.join(',')}
  ]);`;
}

class TriggerData {
  _header = '';
  dependencyPromises: { [dependencyName: string]: { collection: string, promise: string } } = {};
  _resultPromises: string[] = [];
  _data: UpdateData = {};
  _nonUpdateData: UpdateData = {};

  addData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._data).includes(dataName)) {
      this._data[dataName] = {};
    }
    this._data[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addNonUpdateData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._nonUpdateData).includes(dataName)) {
      this._nonUpdateData[dataName] = {};
    }
    this._nonUpdateData[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addHeader(content: string) {
    if (!this._header.includes(content)) {
      this._header += content;
    }
  }
  addResultPromise(content: string) {
    if (!this._resultPromises.join('').includes(content)) {
      this._resultPromises.push(content);
    }
  }
  isEmpty(): boolean {
    return this._header === ''
      && Object.keys(this.dependencyPromises).length === 0
      && this._resultPromises.join('') === ''
      && Object.keys(this._data).length === 0
      && Object.keys(this._nonUpdateData).length === 0;
  }
}

interface UpdateData {
  [dataName: string]: UpdateFieldData;
}

interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string, fieldCondition?: string }
}

enum TriggerType {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}