import { FieldTypes, Rule } from "../utils/interface";
import { validateFieldNotExistTogether, validateKeys, validateLengthOfKey, validateTypeOfPrimitive } from "./utils";

export default function validateSchema(schema: any) {
  validateKeys({
    object: schema,
    requiredKeys: ['collections'],
    optionalKeys: [],
    stackTrace: 'root'
  });
  validateCollections(schema.collections);
}

function validateCollections(collections: any) {
  for (const [colName, col] of Object.entries(collections)) {
    validateCollection(colName, col);
  }
}

function validateCollection(collectionName: string, collection: any) {
  const stackTrace = `collections.${collectionName}`;
  validateKeys({
    object: collection,
    requiredKeys: ['fields', 'rules'],
    optionalKeys: [],
    stackTrace
  });
  validateCollectionRules(collection.rules, `${stackTrace}.rules`);
  validateCollectionFields(collection.fields, `${stackTrace}.fields`);
}

function validateCollectionRules(rules: any, stackTrace: string) {
  validateKeys({
    object: rules,
    requiredKeys: [],
    optionalKeys: ['get', 'list', 'create', 'update', 'delete'],
    stackTrace
  });
  for (const [ruleName, rule] of Object.entries(rules)) {
    const ruleStackTrace = `${stackTrace}.${ruleName}`;
    validateCollectionRule(rule, ruleStackTrace);
  }
}

function validateCollectionRule(rule: any, stackTrace: string) {
  const validValues = Object.values(Rule);
  if (!validValues.includes(rule)) {
    throw Error(`Invalid Value: ${rule} on ${stackTrace}. Valid values: ${validValues}.`)
  }
}

function validateCollectionFields(fields: any, stackTrace: string) {
  for (const [fieldName, field] of Object.entries(fields)) {
    const fieldStackTrace = `${stackTrace}.${fieldName}`;
    validateCollectionField(field, fieldStackTrace);
  }
}

function validateCollectionField(field: any, stackTrace: string) {
  validateKeys({
    object: field,
    requiredKeys: [],
    optionalKeys: ['type', 'isKey', 'isUnique', 'isOptional', 'sum', 'count', 'syncFrom'],
    stackTrace
  });
  validateFieldNotExistTogether(field, "type", ["syncFrom", "count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "isKey", ["isUnique", "isOptional", "syncFrom", "count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "isUnique", ["syncFrom", "count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "isOptional", ["syncFrom", "count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "syncFrom", ["count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "count", ["sum"], stackTrace);
  if (field.type) {
    validateCollectionFieldType(field.type, `${stackTrace}.type`);
  }
  if (field.isKey) {
    validateCollectionFieldIsKey(field.isKey, `${stackTrace}.isKey`);
  }
  if (field.isUnique) {
    validateCollectionFieldIsUnique(field.isUnique, `${stackTrace}.isUnique`);
  }
  if (field.isOptional) {
    validateCollectionFieldIsOptional(field.isOptional, `${stackTrace}.isOptional`);
  }
  if (field.sum) {
    validateCollectionFieldSum(field.sum, `${stackTrace}.sum`);
  }
  if (field.count) {
    validateCollectionFieldCount(field.count, `${stackTrace}.count`);
  }
  if (field.syncFrom) {
    validateCollectionFieldSyncFrom(field.syncFrom, `${stackTrace}.syncFrom`);
  }
}


function validateCollectionFieldType(type: any, stackTrace: string) {
  validateLengthOfKey(type, 1, stackTrace);
  validateKeys({
    object: type,
    requiredKeys: [],
    optionalKeys: Object.values(FieldTypes),
    stackTrace
  });
  if (type.string) {
    validateCollectionStringField(type.string, `${stackTrace}.string`);
  }
  if (type.path) {
    validateCollectionReferenceField(type.path, `${stackTrace}.path`);
  }
  if (type.int) {
    validateCollectionIntField(type.int, `${stackTrace}.int`);
  }
  if (type.timestamp) {
    validateCollectionDatetimeField(type.timestamp, `${stackTrace}.timestamp`)
  }
}

function validateCollectionStringField(stringField: any, stackTrace: string) {
  validateKeys({
    object: stringField,
    requiredKeys: [],
    optionalKeys: ['isOwnerUid', 'minLength', 'maxLength'],
    stackTrace
  });
  if (stringField.isOwnerUid) {
    validateTypeOfPrimitive(stringField.isOwnerUid, 'boolean', `${stackTrace}.isOwnerUid`);
  }
  if (stringField.minLength) {
    validateTypeOfPrimitive(stringField.minLength, 'int', `${stackTrace}.minLength`);
  }
  if (stringField.maxLength) {
    validateTypeOfPrimitive(stringField.maxLength, 'int', `${stackTrace}.maxLength`);
  }
}

function validateCollectionDatetimeField(referenceField: any, stackTrace: string) {
  validateKeys({
    object: referenceField,
    requiredKeys: [],
    optionalKeys: ['serverTimestamp'],
    stackTrace
  });
  if (referenceField.serverTimestamp) {
    validateTypeOfPrimitive(referenceField.serverTimestamp, 'boolean', `${stackTrace}.serverTimestamp`);
  }
}

function validateCollectionReferenceField(referenceField: any, stackTrace: string) {
  validateKeys({
    object: referenceField,
    requiredKeys: ['collection'],
    optionalKeys: ['isOwnerDocRef'],
    stackTrace
  });
  validateTypeOfPrimitive(referenceField.collection, 'string', `${stackTrace}.collection`);
  if (referenceField.isOwnerDocRef) {
    validateTypeOfPrimitive(referenceField.isOwnerDocRef, 'boolean', `${stackTrace}.isOwnerDocRef`);
  }
}

function validateCollectionIntField(intField: any, stackTrace: string) {
  validateKeys({
    object: intField,
    requiredKeys: [],
    optionalKeys: ['min', 'max'],
    stackTrace
  });
  if (intField.min) {
    validateTypeOfPrimitive(intField.min, 'int', `${stackTrace}.min`);
  }
  if (intField.max) {
    validateTypeOfPrimitive(intField.max, 'int', `${stackTrace}.max`);
  }
}

function validateCollectionFieldIsKey(isKey: any, stackTrace: string) {
  validateTypeOfPrimitive(isKey, 'boolean', stackTrace);
}

function validateCollectionFieldIsUnique(isUnique: any, stackTrace: string) {
  validateTypeOfPrimitive(isUnique, 'boolean', stackTrace);
}

function validateCollectionFieldIsOptional(isOptional: any, stackTrace: string) {
  validateTypeOfPrimitive(isOptional, 'boolean', stackTrace);
}

function validateCollectionFieldSum(sum: any, stackTrace: string) {
  validateKeys({
    object: sum,
    requiredKeys: ["collection", "field", "reference"],
    optionalKeys: [],
    stackTrace
  });
  validateTypeOfPrimitive(sum.collection, "string", `${stackTrace}.collection`)
  validateTypeOfPrimitive(sum.field, "string", `${stackTrace}.field`)
  validateTypeOfPrimitive(sum.reference, "string", `${stackTrace}.reference`)
}

function validateCollectionFieldCount(count: any, stackTrace: string) {
  validateKeys({
    object: count,
    requiredKeys: ["collection", "reference"],
    optionalKeys: [],
    stackTrace
  });
  validateTypeOfPrimitive(count.collection, "string", `${stackTrace}.collection`)
  validateTypeOfPrimitive(count.reference, "string", `${stackTrace}.reference`)
}

function validateCollectionFieldSyncFrom(syncFrom: any, stackTrace: string) {
  validateKeys({
    object: syncFrom,
    requiredKeys: ["field", "reference"],
    optionalKeys: [],
    stackTrace
  });
  validateTypeOfPrimitive(syncFrom.field, "string", `${stackTrace}.field`)
  validateTypeOfPrimitive(syncFrom.reference, "string", `${stackTrace}.reference`)
}