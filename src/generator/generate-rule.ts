import * as fs from "fs";
import _ from "lodash";
import {
  Collection,
  CollectionIteration,
  FieldIteration,
  FlamestoreSchema,
  RuleType,
} from "../type";
import { FlamestoreModule } from "./type";
import { colItersOf, fItersOf as fItersOf, isFieldOptional } from "./util";

export default function generateRule(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[]
): void {
  const colsRule = colItersOf(schema)
    .map((colIter) => colRuleTemplate(modules, colIter))
    .join("\n");
  fs.writeFileSync(outputFilePath, ruleTemplate(colsRule));
}

function ruleTemplate(colsRule: string) {
  return `rules_version = '2';
service cloud.firestore {

  match /databases/{database}/documents {
    function isAuthenticated(){
      return request.auth != null;
    }
    function reqData(){
      return request.resource.data;
    }
    function resData(){
      return resource.data;
    }
    function isNotDeleted(fieldName){
      return fieldName in reqData() && fieldName in resData();
    }
    function updatedKeys(){
      return reqData().diff(resData()).affectedKeys();
    }
${colsRule}
  }
}`;
}

function colRuleTemplate(
  modules: FlamestoreModule[],
  colIter: CollectionIteration
) {
  const { colName, col } = colIter;
  const ruleFunction = _(modules)
    .map((module) => module.ruleFunction)
    .compact()
    .map((ruleFunction) => ruleFunction(colIter))
    .flatMap()
    .map((rule) => `\n${rule}`)
    .join("");
  const isOwnerFunction = getIsOwnerFunction(colIter);

  const emptyValidationFunction = { content: "", usedFields: [] };
  const isCreateValidFunction: ValidationFunction = col["rule:create"]
    ? getIsCreateValidFunction(modules, colIter)
    : emptyValidationFunction;
  const isUpdateValidFunction: ValidationFunction = col["rule:update"]
    ? getIsUpdateValidFunction(modules, colIter)
    : emptyValidationFunction;

  const fieldIsValidFunctions = fItersOf(colIter)
    .filter(
      ({ fName }) =>
        isUpdateValidFunction.usedFields.includes(fName) ||
        isCreateValidFunction.usedFields.includes(fName)
    )
    .map((fIter) => getIsFieldsValidFunction(modules, fIter))
    .join("");
  return `    match /${colName}/{documentId} {${ruleFunction}
${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction.content}${
    isUpdateValidFunction.content
  }
      allow get: if ${getRule(col, "rule:get")};
      allow list: if ${getRule(col, "rule:list")};
      allow create: if ${getRule(col, "rule:create")};
      allow update: if ${getRule(col, "rule:update")};
      allow delete: if ${getRule(col, "rule:delete")};
    }`;
}

interface ValidationFunction {
  content: string;
  usedFields: string[];
}

function getRule(col: Collection, ruleType: RuleType) {
  if (col[ruleType]) {
    const rule = col[ruleType];
    if (rule === "all") {
      return "true";
    }
    if (rule === "none") {
      return "false";
    }
    if (rule === "owner" || rule === "authenticated") {
      if (["rule:get", "rule:list", "rule:delete"].includes(ruleType)) {
        let userPermission;
        if (rule === "owner") {
          userPermission = "isResOwner()";
        } else if (rule === "authenticated") {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission}`;
      }
      if (ruleType === "rule:create") {
        let userPermission;
        if (rule === "owner") {
          userPermission = "isReqOwner()";
        } else if (rule === "authenticated") {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission} && isCreateValid()`;
      }
      if (ruleType === "rule:update") {
        let userPermission;
        if (rule === "owner") {
          userPermission = "isReqOwner() && isResOwner()";
        } else if (rule === "authenticated") {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission} && isUpdateValid()`;
      }
    }
  }
  return "false";
}

function getIsCreateValidFunction(
  modules: FlamestoreModule[],
  colIter: CollectionIteration
): ValidationFunction {
  const creatableFields = fItersOf(colIter).filter(
    (fIter) =>
      !_(modules)
        .map((m) => m?.isNotCreatable)
        .compact()
        .some((f) => f(fIter)) &&
      _(modules)
        .map((m) => m?.isCreatable)
        .compact()
        .some((f) => f(fIter))
  );

  const isValids = creatableFields
    .map(({ field, fName }) =>
      isFieldOptional(field)
        ? `(!('${fName}' in reqData()) || ${fName}IsValid())`
        : `${fName}IsValid()`
    )
    .map((x) => `\n          && ${x}`)
    .join("");

  const hasOnlies = creatableFields.map(({ fName }) => `'${fName}'`);

  return {
    usedFields: creatableFields.map(({ fName }) => fName),
    content: `
      function isCreateValid(){
        return reqData().keys().hasOnly([${hasOnlies}])${isValids};
      }`,
  };
}

function getIsUpdateValidFunction(
  modules: FlamestoreModule[],
  colIter: CollectionIteration
): ValidationFunction {
  const updatableFields = fItersOf(colIter).filter(
    (fIter) =>
      !_(modules)
        .map((m) => m?.isNotUpdatable)
        .compact()
        .some((f) => f(fIter)) &&
      _(modules)
        .map((m) => m?.isUpdatable)
        .compact()
        .some((f) => f(fIter))
  );

  const isValids = _(updatableFields)
    .map(({ fName, field }) => [
      `(!('${fName}' in reqData()) || ${fName}IsValid())`,
      ...(!isFieldOptional(field) ? [`isNotDeleted('${fName}')`] : []),
    ])
    .flatMap()
    .map((x) => `\n          && ${x}`)
    .join("");

  const hasOnlies = updatableFields.map(({ fName }) => `'${fName}'`);

  return {
    usedFields: updatableFields.map(({ fName }) => fName),
    content: `
      function isUpdateValid(){
        return updatedKeys().hasOnly([${hasOnlies}])${isValids};
      }`,
  };
}

function getIsOwnerFunction({ colName, col, schema }: CollectionIteration) {
  const isDocExists = `!(exists(/databases/$(database)/documents/${colName}/$(documentId)))`;
  if (schema.authentication) {
    const uidField = schema.authentication.uidField;
    if (schema.authentication.userCollection === colName) {
      return `      function isReqOwner(){
        return request.auth.uid == reqData().${uidField};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == resData().${uidField};
      }`;
    }
    if (col.ownerField) {
      return `      function isReqOwner(){
        return request.auth.uid == get(reqData().${col.ownerField}.reference).data.${uidField};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == get(resData().${col.ownerField}.reference).data.${uidField};
      }`;
    }
  }
  return "";
}

function getIsFieldsValidFunction(
  modules: FlamestoreModule[],
  fIter: FieldIteration
): string {
  const { fName } = fIter;
  const additionalRule = _(modules)
    .map((module) => module.getRule)
    .compact()
    .map((getRule) => getRule(fIter))
    .flatMap()
    .join(" && ");
  return (
    additionalRule &&
    `
      function ${fName}IsValid(){
        let ${fName} = reqData().${fName};
        return ${additionalRule};
      }`
  );
}
