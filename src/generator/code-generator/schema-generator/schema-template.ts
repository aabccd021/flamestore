import { Field, FlamestoreSchema } from "../../schema";
import { getDataTypeString, getPascalCollectionName as getPascalCollectionName, getStringAdaptor } from "../generator-util";

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
  fieldName: string, field: Field, collectionName: string, schema: FlamestoreSchema): string {
  return `'${fieldName}': this.${fieldName}${getStringAdaptor(field, fieldName, collectionName, schema)},`;
}

export function getAttribute(
  fieldName: string, field: Field, collectionName: string, schema: FlamestoreSchema): string {
  return `${fieldName}: ${getDataTypeString(field, fieldName, collectionName, schema)};`;
}