// import chain instead of default import _ to be compatible with
// ts-json-schema-generator
import { chain } from "lodash";
import { ArrayOr } from "../../../types";
import { PathField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";
import { processSchemaField } from "../schema-preprocess-utils/schema-field-utils";
import { SchemaCollection, SchemaField } from "../schema-types";

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
  data: {
    fName: string;
    col: SchemaCollection;
    schemaColMap: { [colName: string]: SchemaCollection };
  }
): PathField {
  const { schemaColMap } = data;
  const syncColName = field.collection;
  const syncSchemaCol = schemaColMap[syncColName];
  const properties = getSchemaFieldProperties({ field, ...data });
  const syncFieldNames = chain([field.syncField]).compact().flatMap().value();
  const syncFields = syncFieldNames.map((syncFName) => {
    const schemaField = syncSchemaCol.fields[syncFName];
    const field = processSchemaField(
      schemaField,
      syncFName,
      syncSchemaCol,
      schemaColMap
    );
    return { fName: syncFName, field };
  });
  return { ...field, ...properties, syncFields };
}
