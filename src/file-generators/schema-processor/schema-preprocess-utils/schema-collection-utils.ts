import _ from "lodash";
import { Collection } from "../../generator-types";
import { processSchemaField } from "./schema-field-utils";
import { SchemaCollection } from "../schema-types";

export function processSchemaCollection(
  schemaCol: SchemaCollection,
  schemaColMap: { [colName: string]: SchemaCollection }
): Collection {
  const { fields: schemaFields, ownerField } = schemaCol;
  const ownerFieldName = ownerField;
  const fields = _.map(schemaFields, (schemaField, fName) => {
    const data = { schemaCol, schemaColMap, fName, schemaField };
    const field = processSchemaField(data);
    return { fName, field };
  });
  return { ownerFieldName, fields };
}
