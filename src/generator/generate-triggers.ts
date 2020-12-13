import * as fs from "fs";
import _ from "lodash";
import * as path from "path";
import * as prettier from "prettier";
import { FlamestoreSchema } from "../type";
import {
  FlamestoreModule,
  TriggerMap,
  CollectionTriggerMap,
  TriggerData,
  getEmptyCollectionTriggerMap,
  isTriggerDataEmpty,
} from "./type";
import {
  colIterOf,
  fIterOf,
  getPascalCollectionName,
  writePrettyFile,
} from "./util";

export default function generate(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[]
): void {
  const triggerMap = getCompleteTriggerMap(schema, modules);
  const triggerDir = path.join(outputFilePath, "flamestore");
  _(triggerMap).forEach((colTriggerMap, colName) => {
    const colString = stringOfCollectionTrigger(colName, colTriggerMap);
    const triggerContent = triggerContentOf(schema, colString);
    const triggerFileContent = prettier.format(triggerContent, {
      parser: "typescript",
    });
    if (!fs.existsSync(triggerDir)) {
      fs.mkdirSync(triggerDir);
    }
    writePrettyFile(path.join(triggerDir, `${colName}.ts`), triggerFileContent);
  });

  const indexFileContent = _.keys(schema.collections)
    .map((colName) => `export * as ${colName} from "./${colName}";`)
    .join("\n");
  writePrettyFile(path.join(triggerDir, "index.ts"), indexFileContent);
}

const triggerContentOf = (schema: FlamestoreSchema, colString: string) => {
  const modelNames = colIterOf(schema)
    .map(({ colName }) => `${getPascalCollectionName(colName)}`)
    .join(",");
  return `
import {${modelNames}} from "../models"
import {foundDuplicate, functions, increment,  serverTimestamp, syncField,  allSettled, update  } from '../utils';

${colString}
`;
};

function getCompleteTriggerMap(
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
): TriggerMap {
  let triggerMap: TriggerMap = {};
  colIterOf(schema).forEach(({ colName }) => {
    triggerMap[colName] = getEmptyCollectionTriggerMap();
  });
  _(modules)
    .map((module) => module.triggerGenerator)
    .compact()
    .forEach((triggerGenerator) => {
      colIterOf(schema).forEach((colIter) =>
        fIterOf(colIter).forEach((fIter) => {
          triggerMap = triggerGenerator(triggerMap, fIter);
        })
      );
    });
  return triggerMap;
}

function stringOfCollectionTrigger(
  colName: string,
  colTriggerMap: CollectionTriggerMap
): string {
  let content = "";
  if (!isTriggerDataEmpty(colTriggerMap.createTrigger)) {
    content += onCreateTemplate(colName, colTriggerMap.createTrigger);
  }
  if (!isTriggerDataEmpty(colTriggerMap.updateTrigger)) {
    content += onUpdateTemplate(colName, colTriggerMap.updateTrigger);
  }
  if (!isTriggerDataEmpty(colTriggerMap.deleteTrigger)) {
    content += onDeleteTemplate(colName, colTriggerMap.deleteTrigger);
  }
  return content;
}

function onCreateTemplate(collectionName: string, refTriggerData: TriggerData) {
  return triggerTemplate(
    "Create",
    collectionName,
    refTriggerData,
    `const data = snapshot.data() as ${getPascalCollectionName(
      collectionName
    )};`
  );
}

function onUpdateTemplate(collectionName: string, refTriggerData: TriggerData) {
  return triggerTemplate(
    "Update",
    collectionName,
    refTriggerData,
    `const before = change.before.data() as ${getPascalCollectionName(
      collectionName
    )};
    const after = change.after.data() as ${getPascalCollectionName(
      collectionName
    )};`
  );
}

function onDeleteTemplate(collectionName: string, refTriggerData: TriggerData) {
  return triggerTemplate(
    "Delete",
    collectionName,
    refTriggerData,
    `const data = snapshot.data() as ${getPascalCollectionName(
      collectionName
    )};`
  );
}

function triggerTemplate(
  triggerType: TriggerType,
  collectionName: string,
  refTriggerData: TriggerData,
  prepareTrigger: string
) {
  const triggerContent = refTriggerDataToString(refTriggerData);
  const dependencyPromises = dependencyPromisesToString(refTriggerData);
  const batchCommit = refTriggerDataToBatchCommitString(
    refTriggerData,
    triggerType
  );

  const finalPrepareTrigger =
    _.keys(refTriggerData.data).filter((e) => e !== "snapshotRef").length ===
      0 && triggerType === "Create"
      ? ""
      : prepareTrigger;

  const firstParam = triggerType === "Update" ? "change" : "snapshot";
  const context = refTriggerData.useContext ? ", context" : "";
  return `
  export const on${triggerType} = functions.firestore
  .document('/${collectionName}/{documentId}')
  .on${triggerType}(async (${firstParam}${context})=>{
    ${finalPrepareTrigger};

    ${refTriggerData.header};

    ${dependencyPromises};

    ${triggerContent};
    ${batchCommit}
  });
  `;
}

function dependencyPromisesToString(triggerData: TriggerData) {
  if (_.keys(triggerData.dependencyPromises).length === 0) {
    return "";
  }
  let dependencyNames = "";
  let dependencyPromises = "";
  let dependencyAssignment = "";
  for (const [dependencyName, dependencyPromise] of _.entries(
    triggerData.dependencyPromises
  )) {
    dependencyNames += `${dependencyName}Snapshot,`;
    dependencyPromises += `${dependencyPromise.promise},`;
    dependencyAssignment += `const ${dependencyName} = ${dependencyName}Snapshot.data() as ${getPascalCollectionName(
      dependencyPromise.collection
    )};`;
  }
  return `const [${dependencyNames}] = await Promise.all([${dependencyPromises}]);${dependencyAssignment}`;
}

function refTriggerDataToString(triggerData: TriggerData) {
  const data = _(triggerData.data)
    .map((refTrigger, refName) => {
      const x = _(refTrigger)
        .map(({ fieldValue }, fieldName) => `${fieldName}: ${fieldValue}`)
        .join(",");
      return `const ${refName}Data= {${x}};`;
    })
    .join("\n");
  const nonUpdateData = _(triggerData.nonUpdateData)
    .map((refTrigger, refName) => {
      const x = _(refTrigger)
        .map(({ fieldValue }, fieldName) => `${fieldName}: ${fieldValue}`)
        .join(",");
      return `const ${refName}Data= {${x}};`;
    })
    .join("\n");
  return data + nonUpdateData;
}

function refTriggerDataToBatchCommitString(
  triggerData: TriggerData,
  triggerType: TriggerType
) {
  const dataName = triggerType === "Update" ? "after" : "data";
  const post = triggerType === "Update" ? ".after" : "";
  const content: string[] = [];
  for (const [refName, refTrigger] of _.entries(triggerData.data)) {
    const setName =
      refName === "snapshotRef"
        ? `snapshot${post}.ref`
        : `${dataName}.${refName}.reference`;
    if (refTrigger !== {}) {
      content.push(`update(${setName},${refName}Data)`);
    }
  }
  const batchCommit = [...content, ...triggerData.resultPromises];
  if (batchCommit.length === 1) {
    return `await ${batchCommit[0]};`;
  }
  return `await allSettled([
       ${batchCommit.join(",")}
  ]);`;
}

type TriggerType = "Create" | "Update" | "Delete";
