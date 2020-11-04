import { getDataTypeString, getPascalCollectionName as getPascalCollectionName, getStringAdaptor } from "../generator-util";
import { FieldContent, FlamestoreSchema } from "../../types/schema";

export const schemaImports = `
`
export function collectionSchema(
  collectionName: string,
  attribute: string,
): string {
  const collectionNamePascal = getPascalCollectionName(collectionName);
  return `
  export interface ${collectionNamePascal} {
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

export function getToString(
  fieldName: string, field: FieldContent, collectionName: string, schema: FlamestoreSchema): string {
  return `'${fieldName}': this.${fieldName}${getStringAdaptor(field, fieldName, collectionName, schema)},`;
}

export function getAttribute(
  fieldName: string, field: FieldContent, collectionName: string, schema: FlamestoreSchema): string {
  return `${fieldName}: ${getDataTypeString(field, fieldName, collectionName, schema)};`;
}