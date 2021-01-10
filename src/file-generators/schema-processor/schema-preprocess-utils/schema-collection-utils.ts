import _ from "lodash";
import { Collection } from "../../generator-types";
import { processSchemaField } from "./schema-field-utils";
import { FlameSchemaAuth, SchemaCollection } from "../schema-types";

export function processSchemaCollection(param: {
  schemaCol: SchemaCollection;
  schemaColMap: { [colName: string]: SchemaCollection };
  colName: string;
  auth?: FlameSchemaAuth;
}): Collection {
  const { schemaCol } = param;
  const { fields: schemaFields, ownerField } = schemaCol;
  const ownerFieldName = ownerField;
  const fields = _.map(schemaFields, (schemaField, fName) => {
    const field = processSchemaField({ ...param, fName, schemaField });
    return { fName, field };
  });
  const keyFieldNames = schemaCol.keyFields ?? [];
  return { ownerFieldName, fields, keyFieldNames };
}
