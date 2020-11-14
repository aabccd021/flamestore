import * as fs from 'fs';
import { Collection, Field, FlamestoreModule, FlamestoreSchema, ReferenceField, Rule, RuleType, StringField } from './type';
import { isOptional, isTypeReference, isTypeString } from './util';

export default function generateRule(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[],
) {
  const collectionsRule =
    Object.entries(schema.collections)
      .map(([collectionName, collection]) =>
        collectionRuleTemplate(collectionName, collection, schema, modules))
      .join('\n');
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
  modules: FlamestoreModule[],
) {
  const ruleFunction = modules
    .map(module => module.ruleFunction ? module.ruleFunction(collection) : [])
    .reduce((a, b) => a.concat(b), [])
    .map(x => `\n${x}`)
    .join('')
  const isOwnerFunction = getIsOwnerFunction(collectionName, collection, schema);

  const isCreateValidFunction: ValidationFunction
    = collection.rules.create
      ? getIsCreateValidFunction(collection, modules)
      : { content: '', usedFields: [] };
  const isUpdateValidFunction: ValidationFunction
    = collection.rules.update
      ? getIsUpdateValidFunction(collection, modules)
      : { content: '', usedFields: [] };
  const fieldIsValidFunctions =
    Object.entries(collection.fields)
      .filter(([fieldName, _]) =>
        isUpdateValidFunction.usedFields.includes(fieldName)
        || isCreateValidFunction.usedFields.includes(fieldName))
      .map(([fieldName, field]) => getIsFieldsValidFunction(fieldName, field, modules))
      .join('');
  return `    match /${collectionName}/{documentId} {${ruleFunction}
${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction.content}${isUpdateValidFunction.content}
      allow get: if ${getRule(collection, RuleType.GET)};
      allow list: if ${getRule(collection, RuleType.LIST)};
      allow create: if ${getRule(collection, RuleType.CREATE)};
      allow update: if ${getRule(collection, RuleType.UPDATE)};
      allow delete: if ${getRule(collection, RuleType.DELETE)};
    }`;
}

interface ValidationFunction {
  content: string,
  usedFields: string[]
}

function getRule(collection: Collection, ruleType: RuleType) {
  if (collection.rules[ruleType]) {
    const rule = collection.rules[ruleType];
    if (rule === Rule.ALL) {
      return 'true';
    }
    if (rule === Rule.NONE) {
      return 'false';
    }
    if (rule === Rule.OWNER || rule === Rule.AUTHENTICATED) {
      if ([RuleType.GET, RuleType.LIST, RuleType.DELETE].includes(ruleType)) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = 'isResOwner()';
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = 'isAuthenticated()';
        }
        return `${userPermission}`;
      }
      if (ruleType === RuleType.CREATE) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = 'isReqOwner()';
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = 'isAuthenticated()';
        }
        return `${userPermission} && isCreateValid()`;
      }
      if (ruleType === RuleType.UPDATE) {
        let userPermission;
        if (rule === Rule.OWNER) {
          userPermission = 'isReqOwner() && isResOwner()';
        } else if (rule === Rule.AUTHENTICATED) {
          userPermission = 'isAuthenticated()';
        }
        return `${userPermission} && isUpdateValid()`;
      }
    }
  }
  return 'false';
}

function getIsCreateValidFunction(collection: Collection, modules: FlamestoreModule[]): ValidationFunction {
  const creatableFields = Object.entries(collection.fields)
    .filter(([f, field]) => {
      for (const module of modules) {
        if (module.isCreatableOverride) {
          const override = module.isCreatableOverride(field);
          if (override !== undefined) {
            return override;
          }
        }
      };
      return modules
        .some(module => module.isCreatable ? module.isCreatable(field) : false);
    })
    .map(([fieldName, _]) => fieldName);

  const isValids = creatableFields
    .map((fieldName) => {
      return isOptional(collection.fields[fieldName])
        ? `(!('${fieldName}' in reqData()) || ${fieldName}IsValid())`
        : `${fieldName}IsValid()`;
    })
    .map(x => `\n          && ${x}`)
    .join('');

  const hasOnlies = creatableFields.map(x => `'${x}'`);

  return {
    usedFields: creatableFields,
    content: `
      function isCreateValid(){
        return reqData().keys().hasOnly([${hasOnlies}])${isValids};
      }`,
  }
}

function getIsUpdateValidFunction(collection: Collection, modules: FlamestoreModule[]): ValidationFunction {

  const updatableFields = Object.entries(collection.fields)
    .filter(([_, field]) => {
      for (const module of modules) {
        if (module.isUpdatableOverride) {
          const override = module.isUpdatableOverride(field);
          if (override !== undefined) {
            return override;
          }
        }
      }
      return modules
        .some(module => module.isUpdatable ? module.isUpdatable(field) : false);
    })
    .map(([fieldName, _]) => fieldName);

  const isValids = updatableFields
    .map((fieldName) => {
      const isNotDeleted = isOptional(collection.fields[fieldName]) ? [] : [`isNotDeleted('${fieldName}')`];
      return [`(!('${fieldName}' in reqData()) || ${fieldName}IsValid())`, ...isNotDeleted];
    })
    .reduce((a, b) => a.concat(b), [])
    .map(x => `\n          && ${x}`)
    .join('');

  const hasOnlies = updatableFields.map(x => `'${x}'`);

  return {
    usedFields: updatableFields,
    content: `
      function isUpdateValid(){
        return updatedKeys().hasOnly([${hasOnlies}])${isValids};
      }`
  }
}

function getIsOwnerFunction(collectionName: string, collection: Collection, schema: FlamestoreSchema) {
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    const isDocExists = `!(exists(/databases/$(database)/documents/${collectionName}/$(documentId)))`;
    const fieldType = field.type;
    if (isTypeString(fieldType) && fieldType.string.isOwnerUid) {
      return `      function isReqOwner(){
        return request.auth.uid == reqData().${fieldName};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == resData().${fieldName};
      }`
    }
    if (isTypeReference(fieldType) && fieldType.path.isOwnerDocRef) {
      const userUidCol = (field.type as ReferenceField).path.collection;
      const userUidFields = schema.collections[userUidCol].fields;
      for (const [userUidFieldName, userUidField] of Object.entries(userUidFields)) {
        if ((userUidField.type as StringField).string?.isOwnerUid) {
          return `      function isReqOwner(){
        return request.auth.uid == get(reqData().${fieldName}).data.${userUidFieldName};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == get(resData().${fieldName}).data.${userUidFieldName};
      }`
        }
      }

    }
  }
  return '';
}

function getIsFieldsValidFunction(
  fieldName: string,
  field: Field,
  modules: FlamestoreModule[]
): string {
  const additionalRule =
    Object.values(modules)
      .map(module => module.getRule ? module.getRule(fieldName, field) : [])
      .reduce((a, b) => a.concat(b), [])
      .join(' && ');

  if (additionalRule === '') {
    return '';
  }
  return `
      function ${fieldName}IsValid(){
        let ${fieldName} = reqData().${fieldName};
        return ${additionalRule};
      }`;
}


