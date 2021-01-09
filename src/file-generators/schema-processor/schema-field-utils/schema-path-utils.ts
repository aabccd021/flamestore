// import chain instead of default import _ to be compatible with
// ts-json-schema-generator
import { chain } from "lodash";
import { ArrayOr } from "../../../types";
import { PathField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";
import { processSchemaField } from "../schema-preprocess-utils/schema-field-utils";
import {
  FlameSchemaAuth,
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
    colName: string;
    auth?: FlameSchemaAuth;
  }
): PathField {
  const { schemaColMap } = params;
  const syncColName = field.collection;
  const schemaCol = schemaColMap[syncColName];
  const properties = getSchemaFieldProperties({ field, ...params });
  const syncFieldNames = chain([field.syncField]).compact().flatMap().value();
  const syncFields = syncFieldNames.map((fName) => {
    const schemaField = schemaCol.fields[fName];
    const field = processSchemaField({ ...params, schemaCol, schemaField });
    return { fName: fName, field };
  });
  return { ...field, ...properties, syncFields, colName: syncColName };
}
