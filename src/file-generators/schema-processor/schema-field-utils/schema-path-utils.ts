// import chain instead of default import _ to be compatible with
// ts-json-schema-generator
import { chain } from "lodash";
import { ArrayOr } from "../../../types";
import { PathField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";
import { processSchemaField } from "../schema-preprocess-utils/schema-field-utils";
import {
  ProjectConfiguration,
  SchemaCollection,
  SchemaField,
} from "../schema-types";

export type PathSchemaField = {
  type: "path";
  collection: string;
  syncField?: ArrayOr<string>;
};

export function isTypeOf(field: SchemaField): field is PathSchemaField {
  return (field as PathSchemaField).type === "path";
}

export function process(
  field: PathSchemaField,
  params: {
    fName: string;
    schemaCol: SchemaCollection;
    schemaColMap: { [colName: string]: SchemaCollection };
    projects: { [name: string]: ProjectConfiguration };
  }
): PathField {
  // TODO: validate key field is only string and path
  const { schemaColMap, fName, schemaCol } = params;
  const syncColName = field.collection;
  const syncSchemaCol = schemaColMap[syncColName];
  const properties = getSchemaFieldProperties({ field, ...params });
  const syncFieldNames = chain([field.syncField]).compact().flatMap().value();
  const syncFields = syncFieldNames.map((fName) => {
    const schemaField = syncSchemaCol.fields[fName];
    const field = processSchemaField({
      ...params,
      schemaCol: syncSchemaCol,
      schemaField,
    });
    return { fName: fName, field };
  });
  const keyFields = schemaCol.keyFields ?? [];
  const isKeyField = keyFields.includes(fName);
  return {
    ...field,
    ...properties,
    syncFields,
    colName: syncColName,
    isKeyField,
  };
}
