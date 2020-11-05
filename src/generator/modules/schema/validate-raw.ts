import { FieldTypes, Rule } from "../../type";

export function validateRaw(schema: any) {
  validateKeys({
    object: schema,
    requiredKeys: ['collections'],
    optionalKeys: ['configuration'],
    stackTrace: 'root'
  });
  validateCollections(schema.collections);
  validateConfiguration(schema.configuration);
}

function validateConfiguration(configuration: any) {
  const stackTrace = `configuration`;
  validateKeys({
    object: configuration,
    requiredKeys: [],
    optionalKeys: ['region', 'ruleOutputPath', 'triggerOutputPath'],
    stackTrace
  });
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
    optionalKeys: [
      'type',
      'isKey',
      'isUnique',
      'isOptional',
      'sum',
      'count',
      'syncFrom',
      'rules',
      'isComputed',
    ],
    stackTrace
  });
  validateFieldNotExistTogether(field, "type", ["syncFrom", "count", "sum"], stackTrace);
  validateFieldNotExistTogether(field, "rules", ["syncFrom", "count", "sum", "isComputed"], stackTrace);
  validateFieldNotExistTogether(field, "isKey", ["isUnique", "isOptional", "syncFrom", "count", "sum", "isComputed"], stackTrace);
  validateFieldNotExistTogether(field, "isUnique", ["syncFrom", "count", "sum", "isComputed"], stackTrace);
  validateFieldNotExistTogether(field, "isOptional", ["syncFrom", "count", "sum", "isComputed"], stackTrace);
  validateFieldNotExistTogether(field, "syncFrom", ["count", "sum", "isComputed"], stackTrace);
  validateFieldNotExistTogether(field, "count", ["sum", "isComputed"], stackTrace);
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
  if (field.rules) {
    validateCollectionFieldRules(field.rules, `${stackTrace}.rules`);
  }
  if (field.isComputed) {
    validateTypeOfPrimitive(field.isComputed, 'boolean', `${stackTrace}.isComputed`);
  }
}


function validateCollectionFieldRules(rules: any, stackTrace: string) {
  validateKeys({
    object: rules,
    requiredKeys: ['isCreatable', 'isUpdatable'],
    optionalKeys: [],
    stackTrace
  });
  if (rules.isCreatable) {
    validateTypeOfPrimitive(rules.isCreatable, 'boolean', `${stackTrace}.isCreatable`);
  }
  if (rules.isUpdatable) {
    validateTypeOfPrimitive(rules.isUpdatable, 'boolean', `${stackTrace}.isUpdatable`);
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
  if (type.float) {
    validateCollectionDatetimeField(type.float, `${stackTrace}.float`)
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
  if (stringField.maxLength && stringField.minLength && stringField.maxLength < stringField.minLength) {
    throw Error(`Invalid Value: maxLength on ${stackTrace}. maxLength can't be smaller that minLength.`)
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
    optionalKeys: ['min', 'max', 'deleteDocWhen'],
    stackTrace
  });
  if (intField.min) {
    validateTypeOfPrimitive(intField.min, 'int', `${stackTrace}.min`);
  }
  if (intField.max) {
    validateTypeOfPrimitive(intField.max, 'int', `${stackTrace}.max`);
  }
  if (intField.deleteDocWhen) {
    validateTypeOfPrimitive(intField.deleteDocWhen, 'int', `${stackTrace}.deleteDocWhen`);
  }
  if (intField.min && intField.max && intField.max < intField.min) {
    throw Error(`Invalid Value: max on ${stackTrace}. max can't be smaller that min.`)
  }
}

function validateCollectionFloatField(floatField: any, stackTrace: string) {
  validateKeys({
    object: floatField,
    requiredKeys: [],
    optionalKeys: ['min', 'max', 'deleteDocWhen'],
    stackTrace
  });
  if (floatField.min) {
    validateTypeOfPrimitive(floatField.min, 'float', `${stackTrace}.min`);
  }
  if (floatField.max) {
    validateTypeOfPrimitive(floatField.max, 'float', `${stackTrace}.max`);
  }
  if (floatField.deleteDocWhen) {
    validateTypeOfPrimitive(floatField.deleteDocWhen, 'float', `${stackTrace}.deleteDocWhen`);
  }
  if (floatField.min && floatField.max && floatField.max < floatField.min) {
    throw Error(`Invalid Value: max on ${stackTrace}. max can't be smaller that min.`)
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

export function validateKeys(
  arg: { object: any; requiredKeys: string[]; optionalKeys: string[]; stackTrace: string; }
) {
  const requiredKeys = new Set(arg.requiredKeys);
  const optionalKeys = new Set(arg.optionalKeys);
  for (const requiredKey of requiredKeys) {
    if (optionalKeys.has(requiredKey)) {
      throw Error(`Key ${requiredKey} should be in either requiredKeys OR optionalKeys on ${arg.stackTrace}.`);
    }
  }
  const validKeys = new Set([...requiredKeys, ...optionalKeys]);
  for (const key of Object.keys(arg.object)) {
    if (!validKeys.has(key)) {
      throw Error(`Invalid Key: ${key} on ${arg.stackTrace}.`);
    }
  }
  for (const requiredKey of requiredKeys) {
    if (!Object.keys(arg.object).includes(requiredKey)) {
      throw Error(`Missing Required Field: ${requiredKey} on ${arg.stackTrace}.`);
    }
  }
}

export function validateTypeOfPrimitive(object: any, type: string, stackTrace: string) {
  if (type === 'int') {
    if (!Number.isInteger(object)) {
      throw Error(`Invalid Value: ${stackTrace} must have type of Integer.`);
    }
  } else if (type === 'float') {
    if (!isNaN(object)) {
      throw Error(`Invalid Value: ${stackTrace} must have type of Number.`);
    }
  } else if (typeof object !== type) {
    throw Error(`Invalid Value: ${stackTrace} must have type of ${type}.`);
  }
}

export function validateLengthOfKey(object: any, length: number, stackTrace: string) {
  if (Object.keys(object).length !== length) {
    throw Error(`Invalid Number of Field: ${stackTrace} must have exactly ${length} fields.`);
  }
}


export function validateFieldNotExistTogether(
  object: any, field: string, notExistTogetherFields: string[], stackTrace: string
) {
  if (object[field]) {
    for (const notExistTogetherField of notExistTogetherFields) {
      if (object[notExistTogetherField]) {
        throw Error(`${stackTrace} can't have both ${field} and ${notExistTogetherField}.`);
      }
    }
  }
}