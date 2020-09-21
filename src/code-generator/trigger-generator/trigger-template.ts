import { TriggerType } from "./interface";
import { getPascalCollectionName } from "../generator-util";
import TriggerData, { UpdateData, UpdateFieldData } from "./trigger-data";

export function onCreateTemplate(
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

export function onUpdateTemplate(
  collectionName: string,
  refTriggerData: TriggerData,
) {
  return triggerTemplate(
    TriggerType.Update,
    collectionName,
    refTriggerData,
    `const before = snapshot.before.data() as ${getPascalCollectionName(collectionName)};
    const after = snapshot.after.data() as ${getPascalCollectionName(collectionName)};`
  );
}

export function onDeleteTemplate(
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
  const pascalCollectionName = getPascalCollectionName(collectionName);
  const triggerContent = refTriggerDataToString(refTriggerData);
  const dependencyPromises = dependencyPromisesToString(refTriggerData);
  const consoleLog = refTriggerDataConsoleLog(refTriggerData, triggerType);
  const batchCommit = refTriggerDataToBatchCommitString(refTriggerData, triggerType)
  const batchCommitPromise = batchCommit ? `return Promise.all([
      ${batchCommit}
    ].map(handleError));`: 'return;';
  return `
  export const on${pascalCollectionName}${triggerType} = functions.firestore
  .document('/${collectionName}/{documentId}')
  .on${triggerType}(async (snapshot, context)=>{
    ${prepareTrigger};${refTriggerData._header};${dependencyPromises};${triggerContent};${consoleLog};
    ${batchCommitPromise}
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
      content += `const ${refName}Data: {[fieldName:string]:any} = {};${refTriggerToString(refName, refTrigger)};`;
    }
  }
  for (const [refName, refTrigger] of Object.entries(triggerData._nonUpdateData)) {
    if (refTrigger !== {}) {
      content += `const ${refName}Data: {[fieldName:string]:any} = {};${refTriggerToString(refName, refTrigger)};`;
    }
  }
  return content;
}

function refTriggerDataConsoleLog(triggerData: TriggerData, triggerType: TriggerType) {
  const dataName = triggerType === TriggerType.Update ? 'after' : 'data';
  const post = triggerType === TriggerType.Update ? '.after' : '';
  let content = '';
  for (const [refName, refTrigger] of Object.entries(triggerData._data)) {
    const setName = refName === 'snapshotRef' ? `snapshot${post}.ref` : `${dataName}.${refName}`
    if (refTrigger !== {}) {
      content += `log(\`Update \${${setName}.id}\`, {updateData: ${refName}Data});`;
    }
  }
  return content;
}

function refTriggerDataToBatchCommitString(triggerData: TriggerData, triggerType: TriggerType) {
  const dataName = triggerType === TriggerType.Update ? 'after' : 'data';
  const post = triggerType === TriggerType.Update ? '.after' : '';
  let content = '';
  for (const [refName, refTrigger] of Object.entries(triggerData._data)) {
    const setName = refName === 'snapshotRef' ? `snapshot${post}.ref` : `${dataName}.${refName}`
    if (refTrigger !== {}) {
      content += `...(Object.keys(${refName}Data).length >0 ? [${setName}.update(
      ${refName}Data,
    )]:[]),`;
    }
  }
  content += triggerData._resultPromises;
  return content;
}

export const importTemplate = `

`;