import * as fs from "fs";
import {
  Collection,
  Field,
  FlamestoreModule,
  FlamestoreSchema,
  Rule,
  RuleType,
} from "../type";
import { isOptional } from "./util";

export default function generateRule(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[]
): void {
  const collectionsRule = Object.entries(schema.collections)
    .map(([collectionName, collection]) =>
      collectionRuleTemplate(collectionName, collection, schema, modules)
    )
    .join("\n");
  fs.writeFileSync(outputFilePath, ruleTemplate(collectionsRule));
}

function ruleTemplate(collectionsRule: string) {
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
${collectionsRule}
  }
}`;
}

function collectionRuleTemplate(
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
) {
  const ruleFunction = modules
    .map((module) =>
      module.ruleFunction
        ? module.ruleFunction(collectionName, collection, schema)
        : []
    )
    .reduce((a, b) => a.concat(b), [])
    .map((x) => `\n${x}`)
    .join("");
  const isOwnerFunction = getIsOwnerFunction(
    collectionName,
    collection,
    schema
  );

  const isCreateValidFunction: ValidationFunction = collection["rule:create"]
    ? getIsCreateValidFunction(collection, modules)
    : { content: "", usedFields: [] };
  const isUpdateValidFunction: ValidationFunction = collection["rule:update"]
    ? getIsUpdateValidFunction(collectionName, collection, schema, modules)
    : { content: "", usedFields: [] };
  const fieldIsValidFunctions = Object.entries(collection.fields)
    .filter(
      ([fieldName]) =>
        isUpdateValidFunction.usedFields.includes(fieldName) ||
        isCreateValidFunction.usedFields.includes(fieldName)
    )
    .map(([fieldName, field]) =>
      getIsFieldsValidFunction(
        schema,
        collectionName,
        collection,
        fieldName,
        field,
        modules
      )
    )
    .join("");
  return `    match /${collectionName}/{documentId} {${ruleFunction}
${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction.content}${
    isUpdateValidFunction.content
  }
      allow get: if ${getRule(collection, RuleType.GET)};
      allow list: if ${getRule(collection, RuleType.LIST)};
      allow create: if ${getRule(collection, RuleType.CREATE)};
      allow update: if ${getRule(collection, RuleType.UPDATE)};
      allow delete: if ${getRule(collection, RuleType.DELETE)};
    }`;
}

interface ValidationFunction {
  content: string;
  usedFields: string[];
}

function getRule(collection: Collection, ruleType: RuleType) {
  if (collection[ruleType]) {
    const rule = collection[ruleType];
    if (rule === Rule.ALL) {
      return "true";
    }
    if (rule === Rule.NONE) {
      return "false";
    }
    if (rule === Rule.OWNER || rule === Rule.AUTHENTICATED) {
      if ([RuleType.GET, RuleType.LIST, RuleType.DELETE].includes(ruleType)) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = "isResOwner()";
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission}`;
      }
      if (ruleType === RuleType.CREATE) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = "isReqOwner()";
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission} && isCreateValid()`;
      }
      if (ruleType === RuleType.UPDATE) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = "isReqOwner() && isResOwner()";
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = "isAuthenticated()";
        }
        return `${userPermission} && isUpdateValid()`;
      }
    }
  }
  return "false";
}

function getIsCreateValidFunction(
  collection: Collection,
  modules: FlamestoreModule[]
): ValidationFunction {
  const creatableFields = Object.entries(collection.fields)
    .filter(([_, field]) => {
      for (const module of modules) {
        if (module.isCreatableOverride) {
          const override = module.isCreatableOverride(field);
          if (override !== undefined) {
            return override;
          }
        }
      }
      return modules.some((module) =>
        module.isCreatable ? module.isCreatable(field) : false
      );
    })
    .map(([fieldName, _]) => fieldName);

  const isValids = creatableFields
    .map((fieldName) => {
      return isOptional(collection.fields[fieldName])
        ? `(!('${fieldName}' in reqData()) || ${fieldName}IsValid())`
        : `${fieldName}IsValid()`;
    })
    .map((x) => `\n          && ${x}`)
    .join("");

  const hasOnlies = creatableFields.map((x) => `'${x}'`);

  return {
    usedFields: creatableFields,
    content: `
      function isCreateValid(){
        return reqData().keys().hasOnly([${hasOnlies}])${isValids};
      }`,
  };
}

function getIsUpdateValidFunction(
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
): ValidationFunction {
  const updatableFields = Object.entries(collection.fields)
    .filter(([fieldName, field]) => {
      for (const module of modules) {
        if (module.isUpdatableOverride) {
          const override = module.isUpdatableOverride(
            fieldName,
            field,
            collectionName,
            collection,
            schema
          );
          if (override !== undefined) {
            return override;
          }
        }
      }
      return modules.some((module) =>
        module.isUpdatable ? module.isUpdatable(field) : false
      );
    })
    .map(([fieldName, _]) => fieldName);

  const isValids = updatableFields
    .map((fieldName) => {
      const isNotDeleted = isOptional(collection.fields[fieldName])
        ? []
        : [`isNotDeleted('${fieldName}')`];
      return [
        `(!('${fieldName}' in reqData()) || ${fieldName}IsValid())`,
        ...isNotDeleted,
      ];
    })
    .reduce((a, b) => a.concat(b), [])
    .map((x) => `\n          && ${x}`)
    .join("");

  const hasOnlies = updatableFields.map((x) => `'${x}'`);

  return {
    usedFields: updatableFields,
    content: `
      function isUpdateValid(){
        return updatedKeys().hasOnly([${hasOnlies}])${isValids};
      }`,
  };
}

function getIsOwnerFunction(
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema
) {
  const isDocExists = `!(exists(/databases/$(database)/documents/${collectionName}/$(documentId)))`;
  if (schema.authentication) {
    const uidField = schema.authentication.uidField;
    if (schema.authentication.userCollection === collectionName) {
      return `      function isReqOwner(){
        return request.auth.uid == reqData().${uidField};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == resData().${uidField};
      }`;
    }
    if (collection.ownerField) {
      return `      function isReqOwner(){
        return request.auth.uid == get(reqData().${collection.ownerField}.reference).data.${uidField};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == get(resData().${collection.ownerField}.reference).data.${uidField};
      }`;
    }
  }
  return "";
}

function getIsFieldsValidFunction(
  schema: FlamestoreSchema,
  collectionName: string,
  collection: Collection,
  fieldName: string,
  field: Field,
  modules: FlamestoreModule[]
): string {
  const additionalRule = Object.values(modules)
    .map((module) =>
      module.getRule
        ? module.getRule(fieldName, field, collectionName, collection, schema)
        : []
    )
    .reduce((a, b) => a.concat(b), [])
    .join(" && ");

  if (additionalRule === "") {
    return "";
  }
  return `
      function ${fieldName}IsValid(){
        let ${fieldName} = reqData().${fieldName};
        return ${additionalRule};
      }`;
}
