import { FlamestoreModule } from "../../module";
import { Collection, FlamestoreSchema, RuleType, Rule, Field, FieldTypes } from "../../schema";

export default function collectionRuleTemplate(
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[],
) {
  const ruleFunction = modules
    .map(module => module.ruleFunction ? module.ruleFunction(collection).filter(x => x !== '').join('\n') : '')
    .filter(x => x !== '')
    .map(x => `\n${x}`)
    .join()
  const isOwnerFunction = getIsOwnerFunction(collectionName, collection, schema);
  const fieldIsValidFunctions =
    Object.entries(collection.fields)
      .map(([fieldName, field]) => getIsFieldsValidFunction(fieldName, field, modules))
      .join('');
  const isCreateValidFunction = collection.rules.create ? getIsCreateValidFunction(collection) : '';
  const isUpdateValidFunction = collection.rules.update ? getIsUpdateValidFunction(collection) : '';
  return `    match /${collectionName}/{documentId} {${ruleFunction}
${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction}${isUpdateValidFunction}
      allow get: if ${getRule(collection, RuleType.GET)};
      allow list: if ${getRule(collection, RuleType.LIST)};
      allow create: if ${getRule(collection, RuleType.CREATE)};
      allow update: if ${getRule(collection, RuleType.UPDATE)};
      allow delete: if ${getRule(collection, RuleType.DELETE)};
    }`;
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

function getIsCreateValidFunction(collection: Collection) {
  const hasOnlies: string[] = [];
  let isValids = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.type && !field.type?.timestamp?.serverTimestamp) {
      hasOnlies.push(`'${fieldName}'`);
      if (field?.isOptional) {
        isValids += `\n          && (!('${fieldName}' in reqData()) || ${fieldName}IsValid())`;
      } else {
        isValids += `\n          && ${fieldName}IsValid()`;
      }
    }
  }
  return `
      function isCreateValid(){
        return reqData().keys().hasOnly([${hasOnlies}])${isValids};
      }`
}

function getIsUpdateValidFunction(collection: Collection) {
  const hasOnlies: string[] = [];
  let isValids = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field?.type && !field.type?.timestamp?.serverTimestamp && !field.isKey) {
      hasOnlies.push(`'${fieldName}'`);
      isValids += `\n          && (!('${fieldName}' in reqData()) || ${fieldName}IsValid())`;
      if (!field.isOptional) {
        isValids += `\n          && isNotDeleted('${fieldName}')`;
      }
    }
  }
  return `
      function isUpdateValid(){
        return updatedKeys().hasOnly([${hasOnlies}])${isValids};
      }`
}

function getIsOwnerFunction(collectionName: string, collection: Collection, schema: FlamestoreSchema) {
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    const isDocExists = `!(exists(/databases/$(database)/documents/${collectionName}/$(documentId)))`;
    if (field.type?.string?.isOwnerUid) {
      return `      function isReqOwner(){
        return request.auth.uid == reqData().${fieldName};
      }
      function isResOwner(){
        return ${isDocExists}
          || request.auth.uid == resData().${fieldName};
      }`
    }
    if (field.type?.path?.isOwnerDocRef) {
      const userUidCol = field.type.path.collection;
      const userUidFields = schema.collections[userUidCol].fields;
      for (const [userUidFieldName, userUidField] of Object.entries(userUidFields)) {
        if (userUidField.type?.string?.isOwnerUid) {
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
      .map(module =>
        module.getRule
          ? module
            .getRule(fieldName, field)
            .filter(x => x !== '')
            .join(' && ')
          : '')
      .filter(x => x !== '')
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


