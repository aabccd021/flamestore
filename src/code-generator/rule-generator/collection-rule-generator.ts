import { CollectionContent, FieldContent, FieldType, FieldTypes, Rule, RuleType, Schema } from "../../utils/interface";
import { getColNameToSyncFrom } from "../../utils/sync-from-util";

export default function collectionRuleTemplate(collectionName: string, collection: CollectionContent, schema: Schema) {
  const isOwnerFunction = getIsOwnerFunction(collection, schema);
  let fieldIsValidFunctions = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    fieldIsValidFunctions += getIsFieldsValidFunction(fieldName, field);
  }
  const isCreateValidFunction = collection.rules.create ? getIsCreateValidFunction(collection) : '';
  const isUpdateValidFunction = collection.rules.update ? getIsUpdateValidFunction(collection) : '';
  return `    match /${collectionName}/{documentId} {
${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction}${isUpdateValidFunction}
      allow get: if ${getRule(collection, RuleType.GET)};
      allow list: if ${getRule(collection, RuleType.LIST)};
      allow create: if ${getRule(collection, RuleType.CREATE)};
      allow update: if ${getRule(collection, RuleType.UPDATE)};
      allow delete: if ${getRule(collection, RuleType.DELETE)};
    }`;
}

function getRule(collection: CollectionContent, ruleType: RuleType) {
  if (collection.rules[ruleType]) {
    const rule = collection.rules[ruleType];
    if (rule === Rule.ALL) {
      return 'true';
    }
    if (rule === Rule.NONE) {
      return 'false';
    }
    // TODO: authenticated trigger
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

function getIsCreateValidFunction(collection: CollectionContent) {
  const hasOnlies: string[] = [];
  let isValids = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.type || field.syncFrom || field.sum || field.count) {
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

function getIsUpdateValidFunction(collection: CollectionContent) {
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

function getIsOwnerFunction(collection: CollectionContent, schema: Schema) {
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.type?.string?.isOwnerUid) {
      return `      function isReqOwner(){
        return request.auth.uid == reqData().${fieldName};
      }
      function isResOwner(){
        return request.auth.uid == resData().${fieldName};
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
        return request.auth.uid == get(resData().${fieldName}).data.${userUidFieldName};
      }`
        }
      }

    }
  }
  return '';
}

function getIsFieldsValidFunction(
  fieldName: string, field: FieldContent
): string {
  let additionalRule = '';
  if (field.type) {
    additionalRule += `${fieldName} is ${getRuleTypeStringOfField(field)}`;
    if (field.type?.string) {
      if (field.type.string?.maxLength || field.type.string?.maxLength === 0) {
        additionalRule += ` && ${fieldName}.size() <= ${field.type.string.maxLength}`
      }
      if (field.type.string?.minLength || field.type.string?.minLength === 0) {
        additionalRule += ` && ${fieldName}.size() >= ${field.type.string.minLength}`
      }
    } else if (field.type?.int) {
      if (field.type.int?.min || field.type.int?.min === 0) {
        additionalRule += ` && ${fieldName} >= ${field.type.int.min}`
      }
      if (field.type.int?.max || field.type.int?.max === 0) {
        additionalRule += ` && ${fieldName} <= ${field.type.int.max}`
      }
    } else if (field.type?.path) {
      additionalRule += ` && exists(${fieldName})`
    } else if (field.type?.timestamp) {
      if (field.type.timestamp.serverTimestamp) {
        additionalRule += ` && ${fieldName} == request.time`
      }
    }
  } else if (field.sum || field.count) {
    additionalRule += `${fieldName} == 0`
  } else if (field.syncFrom) {
    additionalRule += `${fieldName} == get(reqData().${field.syncFrom.reference}).data.${field.syncFrom.field}`
  }
  if (additionalRule !== '') {
    return `
      function ${fieldName}IsValid(){
        let ${fieldName} = reqData().${fieldName};
        return ${additionalRule};
      }`;
  }
  return '';
}


function getRuleTypeStringOfField(field: FieldContent) {
  for (const fieldType of Object.values(FieldTypes)) {
    if (field?.type?.[fieldType]) {
      return fieldType;
    }
  }
}