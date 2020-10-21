import { CollectionContent, FieldContent, FieldType, FieldTypes, Rule, RuleType, Schema } from "../../utils/interface";

export default function collectionRuleTemplate(collectionName: string, collection: CollectionContent, schema: Schema) {
  const extractDocId = getExtractDocumentId(collection, schema);
  const isOwnerFunction = getIsOwnerFunction(collectionName, collection, schema);
  let fieldIsValidFunctions = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    fieldIsValidFunctions += getIsFieldsValidFunction(fieldName, field);
  }
  const isCreateValidFunction = collection.rules.create ? getIsCreateValidFunction(collection) : '';
  const isUpdateValidFunction = collection.rules.update ? getIsUpdateValidFunction(collection) : '';
  return `    match /${collectionName}/{documentId} {
${extractDocId}${isOwnerFunction}${fieldIsValidFunctions}${isCreateValidFunction}${isUpdateValidFunction}
      allow get: if ${getRule(collection, RuleType.GET)};
      allow list: if ${getRule(collection, RuleType.LIST)};
      allow create: if ${getRule(collection, RuleType.CREATE)};
      allow update: if ${getRule(collection, RuleType.UPDATE)};
      allow delete: if ${getRule(collection, RuleType.DELETE)};
    }`;
}

function getExtractDocumentId(collection: CollectionContent, schema: Schema) {
  let content = '';
  let counter = 0;
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.isKey) {
      content += `      function ${fieldName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }\n`;
      counter++;
    }
  }
  return content;
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

function getIsOwnerFunction(collectionName: string, collection: CollectionContent, schema: Schema) {
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
  fieldName: string, field: FieldContent
): string {
  let additionalRule = '';
  if (field.type) {
    if (!field.type?.timestamp?.serverTimestamp) {
      additionalRule += `${fieldName} is ${getRuleTypeStringOfField(field)}`;
    }
    if (field.type?.string) {
      const maxLength = field.type.string?.maxLength;
      if (maxLength || maxLength === 0) {
        additionalRule += ` && ${fieldName}.size() <= ${maxLength}`;
      }
      const minLength = field.type.string?.minLength;
      if (minLength || minLength === 0) {
        additionalRule += ` && ${fieldName}.size() >= ${minLength}`;
      }
      if (field.isKey) {
        additionalRule += ` && ${fieldName} == ${fieldName}OfDocumentId()`;
      }
    } else if (field.type?.int) {
      const min = field.type.int?.min;
      if (min || min === 0) {
        additionalRule += ` && ${fieldName} >= ${min}`;
      }

      const max = field.type.int?.max;
      if (max || max === 0) {
        additionalRule += ` && ${fieldName} <= ${field.type.int.max}`;
      }

      const deleteDocWhen = field.type.int?.deleteDocWhen;
      if (deleteDocWhen || deleteDocWhen === 0) {
        additionalRule += ` && ${fieldName} != ${deleteDocWhen}`;
      }
    } else if (field.type?.path) {
      additionalRule += ` && exists(${fieldName})`;
      if (field.isKey) {
        additionalRule += ` && get(${fieldName}).id == ${fieldName}OfDocumentId()`;
      }
    }
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
