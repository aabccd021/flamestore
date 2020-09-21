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