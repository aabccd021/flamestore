import _ from "lodash";
import { Collection } from "../types";
import { processSchemaField } from "./schema-processor-field-utils";
import { SchemaCollection } from "./schema-types";

export function processSchemaCollection(
  schemaCol: SchemaCollection,
  schemaColMap: { [colName: string]: SchemaCollection }
): Collection {
  const { fields: schemaFields, ownerField } = schemaCol;
  const ownerFieldName = ownerField;
  const fields = _.map(schemaFields, (schemaField, fName) => {
    const field = processSchemaField(
      schemaField,
      fName,
      schemaCol,
      schemaColMap
    );
    return { fName, field };
  });
  return { ownerFieldName, fields };
}
