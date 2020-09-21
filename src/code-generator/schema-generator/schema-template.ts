import { getDataTypeString, getPascalCollectionName as getPascalCollectionName, getStringAdaptor } from "../generator-util";
import { FieldContent, Schema } from "../../utils/interface";

export const schemaImports = `
`
export function collectionSchema(
  collectionName: string,
  attribute: string,
): string {
  const collectionNamePascal = getPascalCollectionName(collectionName);
  return `
  interface ${collectionNamePascal} {
    ${attribute}
  }
  `;
}

export function getConstructor(fieldName: string): string {
  return `this.${fieldName} = snapshot.data().${fieldName}`;
}

export function getStaticField(fieldName: string): string {
  return `static ${fieldName}Key = '${fieldName}';`;
}

export function getToString(fieldName: string, field: FieldContent, collectionName: string, schema: Schema): string {
  return `'${fieldName}': this.${fieldName}${getStringAdaptor(field, fieldName, collectionName, schema)},`;
}

export function getAttribute(fieldName: string, field: FieldContent, collectionName: string, schema: Schema): string {
  return `${fieldName}: ${getDataTypeString(field, fieldName, collectionName, schema)};`;
}